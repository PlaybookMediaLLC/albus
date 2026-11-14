import { and, desc, eq, isNull } from "drizzle-orm";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { postComments } from "../../database/quills/schema/posts";
import { chatJson, requireAi, toHttp, untrusted } from "../assistant/provider";
import { logUsage } from "../assistant/runs";
import { defineQuillsRoute } from "../framework/define-route";
import { findPost, loadProjects } from "./visibility";

// An AI summary of one request and its comments for a teammate (RFC 0004, the AI chip of the
// request detail). The post is read in a scoped transaction, the provider runs with no transaction
// open, and the usage log row is written after. Nothing else is saved.

/** Prompt and answer bounds: the newest comments, about 500 characters each, and one short answer. */
const MAX_COMMENTS = 30;
const EXCERPT = 500;
const MAX_TOKENS = 600;

const answer = z.object({ text: z.string().trim().min(1).max(2000) });

const summarize = defineQuillsRoute({
  method: "post",
  path: "/posts/{postId}/summary",
  operationId: "summarizeQuillsPost",
  summary: "Summarize a feedback post and its comments with AI",
  description:
    "Returns a short summary for the teammate: what is asked, why, and what is still open. It reads the post and its newest 30 comments, private notes included, as the teammate can. Saves nothing; the usage log row is its record. 409 when AI is not configured, 502 when the provider fails.",
  action: "read",
  params: z.object({ postId: flexibleToTypeIdSchema("post") }),
  load: async (input) => {
    requireAi();
    return loadProjects(input);
  },
  prepare: async ({ db, params, loaded }) => {
    const post = await findPost(db, params.postId, loaded);
    const comments = await db
      .select({
        content: postComments.content,
        isTeamMember: postComments.isTeamMember,
        isPrivate: postComments.isPrivate,
      })
      .from(postComments)
      .where(
        and(eq(postComments.postId, post.id), isNull(postComments.deletedAt)),
      )
      .orderBy(desc(postComments.createdAt), desc(postComments.id))
      .limit(MAX_COMMENTS);
    return { post, comments: comments.reverse() };
  },
  call: ({ post, comments }) =>
    chatJson(
      answer,
      [
        {
          role: "system",
          content: [
            "You summarize one feedback request for a product teammate.",
            "Say what the customers ask for, why they need it, and what is still open, in at most five short sentences.",
            "Use only the request and the comments that you get. Do not add names, numbers or promises.",
            'Answer with one JSON object: {"text": string}.',
          ].join("\n"),
        },
        {
          role: "user",
          content: untrusted(
            "request",
            [
              `Title: ${post.title}`,
              `Board: ${post.boardName}`,
              `Details: ${post.content.slice(0, EXCERPT * 4)}`,
              ...comments.map(
                (comment) =>
                  `${comment.isPrivate ? "Private note" : comment.isTeamMember ? "Team" : "Customer"}: ${comment.content.slice(0, EXCERPT)}`,
              ),
            ].join("\n\n"),
          ),
        },
      ],
      MAX_TOKENS,
    ).catch((error) => {
      throw toHttp(error);
    }),
  response: z.object({
    postId: z.string(),
    summary: z.string().openapi({ description: "Plain text" }),
  }),
  responseDescription: "The summary for review",
  errors: {
    404: "Post not found",
    409: "AI is not configured",
    502: "The AI provider failed",
  },
  event: {
    none: "A summary changes no domain data; the usage log row is its record",
  },
  handler: async ({ db, params, called }) => {
    await logUsage(db, [
      {
        step: "post_summary",
        callType: "chat_completion",
        usage: called.usage,
        postId: params.postId,
      },
    ]);
    return { postId: params.postId, summary: called.value.text };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>().openapi(
  ...summarize,
);
