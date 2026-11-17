import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { ConversationId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { postUpdates } from "../../database/quills/schema/post-updates";
import { postComments } from "../../database/quills/schema/posts";
import {
  defineQuillsRoute,
  type Database,
  type QuillsChange,
} from "../framework/define-route";
import {
  followerAccounts,
  updateCandidates,
  updateChannels,
  updateCounts,
  updateCountsOf,
  updateRecipients,
  updateTargets,
  type UpdateCandidates,
} from "../integrations/post-update";
import { insertReply } from "../support/conversation-ops";
import { findConversation } from "../support/conversation-model";
import { countComment } from "./comments";
import { lockMergeTarget } from "./thread-counts";
import { findPost, loadProjects } from "./visibility";

// One "send update" of a request to every channel at once (#92). The preview and the send count the
// recipients with the same steps (integrations/post-update.ts). The send needs Quills update and
// manage_settings, and an explicit release confirmation: no verified release record exists yet (#11),
// and a merged PR or a status change is not one.

const postParams = z.object({ postId: flexibleToTypeIdSchema("post") });
const input = updateTargets.extend({ channels: updateChannels });
const errors = {
  404: "Post or segment not found",
  409: "The release is not confirmed, or the idempotency key belongs to another post",
} as const;

/** The request must be one the teammate can see; then the candidates of step 1. */
const prepare = async ({
  db,
  params,
  body,
  loaded: projects,
}: {
  db: Database;
  params: z.output<typeof postParams>;
  body: z.output<typeof input>;
  loaded: string[];
}) => {
  await findPost(db, params.postId, projects);
  return updateCandidates(db, params.postId, body);
};
const call = async (
  candidates: UpdateCandidates,
  { workspaceId }: { workspaceId: string },
) => ({
  candidates,
  accounts: await followerAccounts(workspaceId, candidates.followers),
});

const preview = defineQuillsRoute({
  method: "post",
  path: "/posts/{postId}/updates/preview",
  operationId: "previewQuillsPostUpdate",
  summary: "Count who a post update reaches on each channel",
  description:
    "Writes nothing. The counts are what sendQuillsPostUpdate sends for the same channels and targets, unless followers or conversations change in between. Above 1,000 matching followers, counts.emailEstimated is true and counts.email is the number of matching followers, before each one's address and access are checked at send time.",
  action: "update",
  alsoRequires: ["manage_settings"],
  params: postParams,
  body: input,
  response: z.object({
    counts: updateCounts,
    slackConnected: z.boolean().openapi({
      description: "A Slack connection sends this board's comments.",
    }),
  }),
  responseDescription: "Recipients per channel",
  errors: { 404: errors[404] },
  event: { none: "A preview writes nothing." },
  load: loadProjects,
  prepare,
  call,
  handler: async ({ db, body, called }) => {
    const recipients = await updateRecipients(
      db,
      called.candidates,
      called.accounts,
      body.channels,
    );
    return {
      counts: updateCountsOf(called.candidates, recipients, body.channels),
      slackConnected: called.candidates.slack > 0,
    };
  },
});

const sendResult = z.object({
  updateId: z.string(),
  counts: updateCounts,
  replayed: z.boolean().openapi({
    description:
      "The idempotency key named an earlier send: nothing was sent again.",
  }),
  commentId: z.string().nullable().openapi({
    description:
      "The page comment of this send; null on a replay or without the page channel.",
  }),
  replies: z
    .array(z.object({ messageId: z.string(), conversationId: z.string() }))
    .openapi({
      description:
        "The reply of this send in each linked conversation; empty on a replay.",
    }),
});

const send = defineQuillsRoute({
  method: "post",
  path: "/posts/{postId}/updates",
  operationId: "sendQuillsPostUpdate",
  summary:
    "Send an update about a post to its followers on every chosen channel",
  description:
    "Needs Quills update and manage_settings, and confirmRelease: true (no verified release record exists yet; a merged PR or a status change is not one). Page: a public team comment. Email: every follower that matches the targets, each once and with no cap; each one's address and access are checked when the mail is sent. Conversations: a reply in each linked conversation, without reopening or claiming it; its customer gets no update mail. Slack: the page comment, through Slack connections that send the board's comments. A repeated idempotency key returns the first send.",
  action: "update",
  alsoRequires: ["manage_settings"],
  params: postParams,
  body: input.extend({
    body: z.string().trim().min(1).max(5000),
    confirmRelease: z.boolean().default(false).openapi({
      description: "The sender confirms that the change shipped.",
    }),
    idempotencyKey: z.string().min(8).max(100),
  }),
  response: sendResult,
  responseDescription: "The update and what it queued",
  errors,
  load: loadProjects,
  prepare: async (args) => {
    if (!args.body.confirmRelease)
      throw new HTTPException(409, {
        message:
          "Confirm that this change shipped: no verified release links this request yet",
      });
    return prepare(args);
  },
  call,
  event: ({ params, body }, result, raw) => {
    if (result.replayed) return false;
    // The customers who got the update as a conversation reply: its mail pages leave them out.
    const replied = (raw as { replied?: string[] }).replied ?? [];
    const changes: QuillsChange[] = [
      {
        type: "post.update_sent",
        entityType: "post",
        entityId: params.postId,
        payload: {
          updateId: result.updateId,
          ...(replied.length && { replied: replied.join(",") }),
        },
      },
    ];
    if (result.commentId)
      changes.push({
        type: "comment.created",
        entityType: "comment",
        entityId: result.commentId,
        // The update mail covers the followers; Slack hears it only when the sender chose Slack.
        payload: {
          postId: params.postId,
          update: result.updateId,
          slack: String(body.channels.slack),
        },
      });
    for (const reply of result.replies)
      changes.push({
        type: "message.created",
        entityType: "conversation_message",
        entityId: reply.messageId,
        payload: { conversationId: reply.conversationId },
      });
    return changes;
  },
  handler: async ({ db, actor, params, body, called }) => {
    const replay = async () => {
      const [earlier] = await db
        .select({
          id: postUpdates.id,
          postId: postUpdates.postId,
          counts: postUpdates.counts,
        })
        .from(postUpdates)
        .where(eq(postUpdates.idempotencyKey, body.idempotencyKey));
      if (!earlier) return undefined;
      if (earlier.postId !== params.postId)
        throw new HTTPException(409, {
          message: "The idempotency key belongs to another post",
        });
      return {
        updateId: earlier.id,
        // Updates sent before emailEstimated existed counted every recipient.
        counts: {
          emailEstimated: false,
          ...earlier.counts,
        } as z.output<typeof updateCounts>,
        replayed: true,
        commentId: null,
        replies: [],
      };
    };
    const earlier = await replay();
    if (earlier) return earlier;
    const { candidates } = called;
    const recipients = await updateRecipients(
      db,
      candidates,
      called.accounts,
      body.channels,
    );
    const counts = updateCountsOf(candidates, recipients, body.channels);
    // The unique key makes a parallel send with the same key wait here, then replay.
    const [update] = await db
      .insert(postUpdates)
      .values({
        postId: params.postId,
        principalId: actor.principalId,
        body: body.body,
        channels: body.channels,
        segmentIds: body.segmentIds,
        languages: body.languages,
        releaseConfirmed: true,
        counts,
        idempotencyKey: body.idempotencyKey,
      })
      .onConflictDoNothing()
      .returning({ id: postUpdates.id });
    if (!update) return (await replay())!;
    let commentId: string | null = null;
    if (body.channels.page) {
      const target = await lockMergeTarget(db, params.postId);
      const [comment] = await db
        .insert(postComments)
        .values({
          postId: params.postId,
          principalId: actor.principalId,
          content: body.body,
          isTeamMember: true,
          isPrivate: false,
        })
        .returning();
      await countComment(db, comment!, 1, target);
      commentId = comment!.id;
    }
    const replies: { messageId: string; conversationId: string }[] = [];
    if (body.channels.conversations)
      for (const { id } of candidates.conversations) {
        const conversation = await findConversation(
          db,
          id as ConversationId,
          true,
        );
        // A reply-all copy: it never reopens, claims or resolves the conversation.
        const messageId = await insertReply(
          db,
          actor,
          conversation,
          body.body,
          null,
          body.body,
          null,
          false,
        );
        replies.push({ messageId, conversationId: conversation.id });
      }
    return {
      updateId: update.id,
      counts,
      replayed: false,
      commentId,
      replies,
      replied: candidates.replied,
    };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...preview)
  .openapi(...send);
