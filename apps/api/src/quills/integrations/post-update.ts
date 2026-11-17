// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { and, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { PostId, PrincipalId, TypeId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { z } from "../../openapi";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { conversations } from "../../database/quills/schema/conversation";
import { postExternalLinks } from "../../database/quills/schema/external-links";
import {
  integrationEventMappings,
  integrations,
} from "../../database/quills/schema/integrations";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { posts } from "../../database/quills/schema/posts";
import { segments, userSegments } from "../../database/quills/schema/segments";
import { realEmail } from "../directory/customer";
import type { Database } from "../framework/define-route";
import { portalAccount } from "../framework/platform-reads";
import { wants } from "../jobs/preferences";
import {
  postVisible,
  viewerFor,
  visibleBoards,
} from "../portal/feedback/viewer";

// One "send update" of a request (#92): who it reaches on each channel. The preview and the send run
// the same three steps, so the preview's counts are what the send queues:
// 1. candidates (scoped transaction): followers and linked conversations that match the targets;
// 2. accounts (no transaction): the Kaneo account of each portal customer;
// 3. recipients (scoped transaction): the followers who may see the request now, with a real address,
//    as the mail worker's send-time check (handlers/support-mail.ts#customerPostAddress) decides.

/** The mail preference type of an update. */
export const UPDATE_MAIL_TYPE = "post_update";
/** ponytail: at most 1,000 followers and 100 conversations per update; page them when requests grow past that. */
const MAX_FOLLOWERS = 1000;
const MAX_CONVERSATIONS = 100;
const LANGUAGE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

export const updateTargets = z.object({
  segmentIds: z
    .array(flexibleToTypeIdSchema("segment"))
    .max(20)
    .default([])
    .openapi({
      description: "Only customers in one of these segments. Empty: everyone.",
    }),
  languages: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(LANGUAGE, "A BCP-47 language tag, such as fr or pt-br"),
    )
    .max(10)
    .default([])
    .openapi({
      description:
        "Only customers whose language (preferred language, else locale) is one of these or a region of one (fr matches fr-CA). Empty: everyone.",
    }),
});
export type UpdateTargets = z.output<typeof updateTargets>;

export const updateChannels = z.object({
  page: z
    .boolean()
    .openapi({ description: "A public team comment on the request." }),
  email: z
    .boolean()
    .openapi({ description: "Mail to the request's followers." }),
  conversations: z.boolean().openapi({
    description: "A reply in each support conversation linked to the request.",
  }),
  slack: z.boolean().openapi({
    description:
      "The page comment, posted by each Slack connection that sends comments of the request's board. Needs page.",
  }),
});
export type UpdateChannels = z.output<typeof updateChannels>;

export const updateCounts = z.object({
  page: z.number(),
  email: z.number(),
  conversations: z.number(),
  slack: z.number(),
});

type Person = {
  principalId: PrincipalId;
  customerId: TypeId<"user">;
  kaneoUserId: string | null;
  email: string | null;
};

/** The customer matches the segment and language targets. */
function matches(targets: UpdateTargets): SQL | undefined {
  const parts: SQL[] = [];
  if (targets.segmentIds.length)
    parts.push(
      sql`exists (select 1 from ${userSegments} where ${userSegments.principalId} = ${principal.id} and ${inArray(userSegments.segmentId, targets.segmentIds)})`,
    );
  if (targets.languages.length) {
    const language = sql`lower(coalesce(${customer.preferredLanguage}, ${customer.locale}))`;
    parts.push(
      sql`(${sql.join(
        targets.languages.map(
          (tag) =>
            sql`(${language} = ${tag} or ${language} like ${`${tag}-%`})`,
        ),
        sql` or `,
      )})`,
    );
  }
  return parts.length ? and(...parts) : undefined;
}

/** 404 unless every target segment is a live segment of this workspace. */
async function checkSegments(db: Database, ids: readonly TypeId<"segment">[]) {
  if (!ids.length) return;
  const found = await db
    .select({ id: segments.id })
    .from(segments)
    .where(and(inArray(segments.id, [...ids]), isNull(segments.deletedAt)));
  if (found.length !== new Set(ids).size)
    throw new HTTPException(404, { message: "Segment not found" });
}

/**
 * Step 1, in the request's scoped transaction: the live request, its followers and its linked conversations
 * whose customer matches the targets and is no teammate, test customer or blocked person, and the Slack
 * connections that send its comments. A follower who turned update mail off is left out.
 */
export async function updateCandidates(
  db: Database,
  postId: PostId,
  targets: UpdateTargets,
) {
  await checkSegments(db, targets.segmentIds);
  const [post] = await db
    .select({ id: posts.id, title: posts.title, boardId: posts.boardId })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)));
  if (!post) throw new HTTPException(404, { message: "Post not found" });
  const person = {
    principalId: principal.id,
    customerId: customer.id,
    kaneoUserId: customer.kaneoUserId,
    email: customer.email,
  };
  const customerOnly = and(
    isNull(principal.kaneoUserId),
    isNull(principal.blockedAt),
    isNull(principal.testOwnerPrincipalId),
    matches(targets),
  );
  const followers = await db
    .select(person)
    .from(postSubscriptions)
    .innerJoin(principal, eq(principal.id, postSubscriptions.principalId))
    .innerJoin(customer, eq(customer.id, principal.userId))
    .where(
      and(
        eq(postSubscriptions.postId, post.id),
        eq(postSubscriptions.notifyStatusChanges, true),
        customerOnly,
      ),
    )
    .orderBy(principal.id)
    .limit(MAX_FOLLOWERS);
  const wanted: Person[] = [];
  for (const follower of followers)
    if (await wants(db, follower.principalId, UPDATE_MAIL_TYPE, "email"))
      wanted.push(follower);
  const links = await db
    .select({ externalId: postExternalLinks.externalId })
    .from(postExternalLinks)
    .where(
      and(
        eq(postExternalLinks.postId, post.id),
        eq(postExternalLinks.integrationType, "live_chat"),
        eq(postExternalLinks.status, "active"),
      ),
    )
    .limit(MAX_CONVERSATIONS);
  const conversationIds = links.flatMap(
    (link) =>
      flexibleToTypeIdSchema("conversation").safeParse(link.externalId).data ??
      [],
  );
  const linked = conversationIds.length
    ? await db
        .select({ id: conversations.id, principalId: principal.id })
        .from(conversations)
        .innerJoin(
          principal,
          eq(principal.id, conversations.visitorPrincipalId),
        )
        .innerJoin(customer, eq(customer.id, principal.userId))
        .where(
          and(
            inArray(conversations.id, conversationIds),
            isNull(conversations.archivedAt),
            customerOnly,
          ),
        )
    : [];
  const [slack] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(integrationEventMappings)
    .innerJoin(
      integrations,
      eq(integrations.id, integrationEventMappings.integrationId),
    )
    .where(
      and(
        eq(integrations.integrationType, "slack"),
        eq(integrations.status, "active"),
        eq(integrationEventMappings.enabled, true),
        eq(integrationEventMappings.eventType, "comment.created"),
        // The fan-out's board filter (handlers/integration.ts#boardAllowed).
        sql`(coalesce(jsonb_array_length(${integrationEventMappings.filters}->'boardIds'), 0) = 0 or ${integrationEventMappings.filters}->'boardIds' ? ${post.boardId})`,
      ),
    );
  return {
    post,
    followers: wanted,
    conversations: linked,
    slack: slack?.count ?? 0,
  };
}
export type UpdateCandidates = Awaited<ReturnType<typeof updateCandidates>>;

/** Step 2, with no transaction open: the Kaneo account of each portal customer among the followers. */
export async function followerAccounts(
  workspaceId: string,
  followers: readonly Person[],
) {
  const accounts = new Map<
    string,
    NonNullable<Awaited<ReturnType<typeof portalAccount>>>
  >();
  for (const { kaneoUserId } of followers)
    if (kaneoUserId && !accounts.has(kaneoUserId)) {
      const account = await portalAccount(workspaceId, kaneoUserId);
      if (account) accounts.set(kaneoUserId, account);
    }
  return accounts;
}

/**
 * Step 3, in a scoped transaction: the followers who get the mail, by the worker's rule: a verified account
 * address (or a widget profile's real address), and the request visible to them now. A follower whose
 * linked conversation gets the update as a reply is left out, so nobody hears it twice.
 */
export async function updateRecipients(
  db: Database,
  candidates: UpdateCandidates,
  accounts: Awaited<ReturnType<typeof followerAccounts>>,
  channels: UpdateChannels,
) {
  const replied = new Set(
    channels.conversations
      ? candidates.conversations.map((row) => row.principalId)
      : [],
  );
  const recipients: PrincipalId[] = [];
  if (!channels.email) return recipients;
  for (const follower of candidates.followers) {
    if (replied.has(follower.principalId)) continue;
    const account = follower.kaneoUserId
      ? accounts.get(follower.kaneoUserId)
      : undefined;
    if (follower.kaneoUserId && !account?.emailVerified) continue;
    if (!realEmail(account ? account.email : follower.email)) continue;
    try {
      const viewer = await viewerFor(db, account ? "portal" : "widget", {
        principalId: follower.principalId,
        customerId: follower.customerId,
        account: account ?? null,
      });
      const boards = await visibleBoards(db, viewer);
      const [visible] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.id, candidates.post.id),
            postVisible(
              viewer,
              boards.map((board) => board.id),
            ),
          ),
        );
      if (visible) recipients.push(follower.principalId);
    } catch (error) {
      // A closed portal or widget, or a private portal that denies the customer.
      if (!(error instanceof HTTPException)) throw error;
    }
  }
  return recipients;
}

/** What one send queues per channel. Slack posts the page comment, so it needs the page channel. */
export const updateCountsOf = (
  candidates: UpdateCandidates,
  recipients: readonly PrincipalId[],
  channels: UpdateChannels,
) => ({
  page: channels.page ? 1 : 0,
  email: recipients.length,
  conversations: channels.conversations ? candidates.conversations.length : 0,
  slack: channels.page && channels.slack ? candidates.slack : 0,
});
