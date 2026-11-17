import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { ConversationId, PostId, PrincipalId } from "@kaneo/ids";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { conversations } from "../../database/quills/schema/conversation";
import { events } from "../../database/quills/schema/events";
import {
  notificationPreferences,
  postSubscriptions,
  unsubscribeTokens,
} from "../../database/quills/schema/notifications";
import {
  helpCenterArticleFeedback,
  helpCenterArticles,
  helpCenterCategories,
} from "../../database/quills/schema/kb";
import {
  postComments,
  posts,
  postVotes,
} from "../../database/quills/schema/posts";
import { postMentions } from "../../database/quills/schema/post-mentions";
import { surveyResponses, surveys } from "../../database/quills/schema/surveys";
import { ticketSubscriptions } from "../../database/quills/schema/ticket-subscriptions";
import { tickets } from "../../database/quills/schema/tickets";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import publicRouter from "../public";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import { conversationOf, ticketOf } from "../support/customer/seed.fixture";
import { portalLinkKey } from "../widget/portal-link";
import { enableWidget, signIdentity } from "../widget/seed.fixture";
import {
  customerPost,
  enablePortal,
  widgetProfile,
} from "./customer-seed.fixture";
import { portalPaths } from "./paths";

let pool: Pool;
vi.mock("../../database/index", () => ({
  getDatabasePool: () => pool,
  get schema() {
    return kaneo;
  },
  default: new Proxy(
    {},
    {
      get(_target, property) {
        const db = drizzle(pool, { schema: kaneo });
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
vi.mock("../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
vi.mock("../../ws", () => ({ broadcastToUserAndWait: vi.fn(async () => {}) }));

const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
const env = () => contractEnv();
let client = 0;
let secret: string;

/** A request as a portal account (`user`), a widget session (`bearer`) or the owner of A (`teammate`). */
async function call(
  method: string,
  path: string,
  options: {
    user?: string;
    bearer?: string;
    body?: unknown;
    teammate?: boolean;
    workspace?: string;
  } = {},
) {
  const res = await app.request(
    `${options.teammate ? "/quills" : "/quills-public"}/${options.workspace ?? env().a}${path}`,
    {
      method,
      headers: {
        "x-test-user": options.teammate ? env().owner : (options.user ?? ""),
        "x-kaneo-client-ip": `198.18.0.${++client % 250}`,
        ...(options.bearer && { authorization: `Bearer ${options.bearer}` }),
        ...(options.body !== undefined && {
          "content-type": "application/json",
        }),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    },
  );
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** Mail delivery on (port 9 refuses, so no mail leaves the test) or off. */
function smtp(on: boolean) {
  vi.stubEnv("SMTP_HOST", on ? "127.0.0.1" : "");
  vi.stubEnv("SMTP_PORT", "9");
  vi.stubEnv("SMTP_FROM", on ? "widget-link@example.test" : "");
}

/** A Kaneo account with no membership: a portal customer. */
async function account(verified: boolean) {
  const id = env().id("acct").toLowerCase();
  const email = `${id}@example.test`;
  await env()
    .db.insert(kaneo.userTable)
    .values({ id, name: `Portal ${id}`, email, emailVerified: verified });
  return { id, email };
}

const identify = (sub: string, email: string, key = secret) =>
  call("POST", "/widget/identify", {
    body: {
      ssoToken: signIdentity(
        {
          sub,
          email,
          name: `Widget ${sub}`,
          exp: Math.floor(Date.now() / 1000) + 300,
        },
        key,
      ),
    },
  });
const link = (user: string, workspace?: string) =>
  call("POST", "/portal/widget-link", { user, workspace });

async function vote(postId: string, principalId: string) {
  await env().scoped(env().a, async (db) => {
    await db.insert(postVotes).values({
      postId: postId as PostId,
      principalId: principalId as PrincipalId,
    });
    await db.insert(postSubscriptions).values({
      postId: postId as PostId,
      principalId: principalId as PrincipalId,
      reason: "vote",
    });
    const [row] = await db
      .select({ voteCount: posts.voteCount })
      .from(posts)
      .where(eq(posts.id, postId as PostId));
    await db
      .update(posts)
      .set({ voteCount: row!.voteCount + 1 })
      .where(eq(posts.id, postId as PostId));
  });
}

/** Who holds each kind of activity row, by post, conversation, ticket and survey. */
const holders = (ids: {
  postIds: string[];
  conversationId: string;
  ticketId: string;
  surveyId: string;
}) =>
  env().scoped(env().a, async (db) => {
    const postIds = ids.postIds as PostId[];
    const order = <T extends { postId: string }>(rows: T[]) =>
      rows.sort(
        (x, y) =>
          postIds.indexOf(x.postId as PostId) -
          postIds.indexOf(y.postId as PostId),
      );
    return {
      votes: order(
        await db
          .select({
            postId: postVotes.postId,
            principalId: postVotes.principalId,
          })
          .from(postVotes)
          .where(inArray(postVotes.postId, postIds)),
      ),
      voteCounts: order(
        await db
          .select({ postId: posts.id, count: posts.voteCount })
          .from(posts)
          .where(inArray(posts.id, postIds)),
      ),
      subscriptions: order(
        await db
          .select({
            postId: postSubscriptions.postId,
            principalId: postSubscriptions.principalId,
          })
          .from(postSubscriptions)
          .where(inArray(postSubscriptions.postId, postIds)),
      ),
      comments: (
        await db
          .select({ principalId: postComments.principalId })
          .from(postComments)
          .where(inArray(postComments.postId, postIds))
      ).map((row) => row.principalId),
      conversation: (
        await db
          .select({ principalId: conversations.visitorPrincipalId })
          .from(conversations)
          .where(eq(conversations.id, ids.conversationId as ConversationId))
      )[0]?.principalId,
      ticket: (
        await db
          .select({ principalId: tickets.requesterPrincipalId })
          .from(tickets)
          .where(eq(tickets.id, ids.ticketId as typeof tickets.$inferSelect.id))
      )[0]?.principalId,
      ticketSubscribers: (
        await db
          .select({ principalId: ticketSubscriptions.principalId })
          .from(ticketSubscriptions)
          .where(
            eq(
              ticketSubscriptions.ticketId,
              ids.ticketId as typeof tickets.$inferSelect.id,
            ),
          )
      ).map((row) => row.principalId),
      survey: (
        await db
          .select({ principalId: surveyResponses.principalId })
          .from(surveyResponses)
          .where(
            eq(
              surveyResponses.surveyId,
              ids.surveyId as typeof surveys.$inferSelect.id,
            ),
          )
      ).map((row) => row.principalId),
    };
  });

const profileOf = (principalId: string) =>
  env().scoped(
    env().a,
    async (db) =>
      (
        await db
          .select({
            customerId: customer.id,
            email: customer.email,
            externalId: customer.externalId,
            kaneoUserId: customer.kaneoUserId,
            name: customer.name,
          })
          .from(principal)
          .innerJoin(customer, eq(customer.id, principal.userId))
          .where(eq(principal.id, principalId as PrincipalId))
      )[0],
  );

const mergeEvents = (principalId: string) =>
  env().scoped(env().a, (db) =>
    db
      .select({ payload: events.payload, entityId: events.entityId })
      .from(events)
      .where(
        and(
          eq(events.type, "user.lead_merged"),
          eq(events.entityId, principalId),
        ),
      ),
  );

/** The latest sign-in link that Kaneo stored for `email`, as the mail would carry it. */
async function signInLink(email: string) {
  const { rows } = await pool.query<{ identifier: string }>(
    `SELECT identifier FROM public.verification WHERE identifier LIKE 'magic-link:%' AND value::jsonb->>'email' = $1 ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  const token = rows[0]!.identifier.slice("magic-link:".length);
  return {
    token,
    // The query that sign-in-link.ts asks Kaneo for; the browser proof opens the mailed URL itself.
    url: `/api/auth/magic-link/verify?${new URLSearchParams({ token, callbackURL: portalPaths.myFeedback(env().a), errorCallbackURL: portalPaths.signIn(env().a) })}`,
  };
}

/** Opens a sign-in link through Kaneo's own auth handler, as the browser would. */
async function open(path: string) {
  const { auth } = await import("../../auth");
  const res = await auth.handler(
    new Request(new URL(path, auth.options.baseURL), { redirect: "manual" }),
  );
  return {
    status: res.status,
    location: res.headers.get("location") ?? "",
    session: (res.headers.get("set-cookie") ?? "").includes("session_token"),
  };
}

describe.skipIf(!url)(
  "Quills widget profile link (issue #129, option C)",
  () => {
    beforeAll(async () => {
      pool = new Pool({ connectionString: url, max: 6 });
      await startContract(pool, url!);
      for (const key of [
        "EMAIL_SES_ACCESS_KEY_ID",
        "EMAIL_SES_SECRET_ACCESS_KEY",
        "EMAIL_RESEND_API_KEY",
        "RESEND_API_KEY",
        "EMAIL_SMTP_HOST",
      ])
        vi.stubEnv(key, "");
      smtp(true);
      // Kaneo's auth module needs a secret to load; the sign-in link routes use it.
      if (!process.env.AUTH_SECRET)
        vi.stubEnv(
          "AUTH_SECRET",
          "widget-link-auth-secret-of-at-least-32-chars",
        );
      await enablePortal(env(), env().a);
      await enablePortal(env(), env().b);
      secret = await enableWidget(env(), env().a);
    }, 120000);
    afterAll(async () => {
      vi.unstubAllEnvs();
      await stopContract();
    });

    it("hides and refuses Open in portal on an instance without mail delivery", async () => {
      const person = await account(false);
      smtp(false);
      try {
        const identified = await identify(env().id("sub"), person.email);
        expect(identified.body.canPortalHandoff).toBe(false);
        const sent = await call("POST", "/widget/portal-link", {
          bearer: identified.body.sessionToken,
        });
        expect(sent.status).toBe(403);
      } finally {
        smtp(true);
      }
    });

    it("never links a workspace member's widget profile", async () => {
      const [owner] = await env()
        .db.update(kaneo.userTable)
        .set({ emailVerified: true })
        .where(eq(kaneo.userTable.id, env().owner))
        .returning({ email: kaneo.userTable.email });
      const kept = await widgetProfile(
        env(),
        env().a,
        owner!.email.toLowerCase(),
      );
      expect((await link(env().owner)).body.mergedPrincipalId).toBeNull();
      expect(await profileOf(kept.principalId)).toMatchObject({
        kaneoUserId: null,
      });
    });

    it("merges the widget history into the portal profile after a sign-in link proves the email, once", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const person = await account(false);
      const sub = env().id("sub");
      const identified = await identify(sub, person.email);
      expect(identified.status).toBe(200);
      expect(identified.body.canPortalHandoff).toBe(true);
      const widget: string = identified.body.principalId;
      const widgetSession: string = identified.body.sessionToken;
      const portal = await env().portalCustomer(env().a, person.id);

      // Both profiles voted for the first post and follow it; only the widget voted for the second.
      const shared = await customerPost(env(), env().a);
      const second = await customerPost(env(), env().a);
      await vote(shared.postId, widget);
      await vote(shared.postId, portal.principalId);
      await vote(second.postId, widget);
      const { conversationId } = await conversationOf(
        env(),
        env().a,
        widget as PrincipalId,
      );
      const { ticketId } = await ticketOf(
        env(),
        env().a,
        widget as PrincipalId,
        conversationId as ConversationId,
      );
      const surveyId = await env().scoped(env().a, async (db) => {
        await db.insert(postComments).values({
          postId: second.postId as PostId,
          principalId: widget as PrincipalId,
          content: "From the widget",
        });
        const [survey] = await db
          .insert(surveys)
          .values({
            type: "nps",
            question: env().id("question"),
            status: "active",
          })
          .returning({ id: surveys.id });
        await db.insert(surveyResponses).values({
          surveyId: survey!.id,
          principalId: widget as PrincipalId,
          score: 9,
        });
        return survey!.id;
      });
      const ids = {
        postIds: [shared.postId, second.postId],
        conversationId,
        ticketId,
        surveyId,
      };
      const before = await holders(ids);
      expect(before.voteCounts.map((row) => row.count)).toEqual([2, 1]);

      // "Open in portal": Kaneo's sign-in link goes to the widget profile's email.
      const sent = await call("POST", "/widget/portal-link", {
        bearer: widgetSession,
      });
      expect(sent).toEqual({ status: 200, body: { sent: true } });

      // An unverified email links nothing, even with the request open.
      expect((await link(person.id)).body).toEqual({
        principalId: portal.principalId,
        mergedPrincipalId: null,
      });
      expect(await holders(ids)).toEqual(before);

      const mail = await signInLink(person.email);
      const opened = await open(mail.url);
      expect(opened.status).toBe(302);
      expect(opened.location).toBe(portalPaths.myFeedback(env().a));
      expect(opened.session).toBe(true);
      const [verified] = await env()
        .db.select({ emailVerified: kaneo.userTable.emailVerified })
        .from(kaneo.userTable)
        .where(eq(kaneo.userTable.id, person.id));
      expect(verified!.emailVerified).toBe(true);

      // A replayed link is rejected: no session.
      const replayed = await open(mail.url);
      expect(replayed.location.startsWith(portalPaths.signIn(env().a))).toBe(
        true,
      );
      expect(replayed.location).toContain("error=INVALID_TOKEN");
      expect(replayed.session).toBe(false);

      // The portal links the profiles.
      const linked = await link(person.id);
      expect(linked).toEqual({
        status: 200,
        body: { principalId: portal.principalId, mergedPrincipalId: widget },
      });
      const after = await holders(ids);
      expect(after.votes).toEqual([
        { postId: shared.postId, principalId: portal.principalId },
        { postId: second.postId, principalId: portal.principalId },
      ]);
      // The duplicate vote and subscription are dropped, so the counts do not grow.
      expect(after.voteCounts.map((row) => row.count)).toEqual([1, 1]);
      expect(after.subscriptions).toEqual([
        { postId: shared.postId, principalId: portal.principalId },
        { postId: second.postId, principalId: portal.principalId },
      ]);
      expect(after.comments).toEqual([portal.principalId]);
      expect(after.conversation).toBe(portal.principalId);
      expect(after.ticket).toBe(portal.principalId);
      expect(after.ticketSubscribers).toEqual([portal.principalId]);
      expect(after.survey).toEqual([portal.principalId]);
      expect(await profileOf(widget)).toBeUndefined();
      expect(await profileOf(portal.principalId)).toMatchObject({
        customerId: portal.customerId,
        email: person.email,
        externalId: sub,
        kaneoUserId: person.id,
        name: `Portal ${person.id}`,
      });
      expect(await mergeEvents(portal.principalId)).toEqual([
        { entityId: portal.principalId, payload: { leadPrincipalId: widget } },
      ]);
      const { rows: audit } = await pool.query(
        `SELECT count(*)::int AS n FROM quills.audit_log l JOIN quills.principal p ON p.id = l.actor_principal_id AND p.workspace_id = l.workspace_id
       WHERE l.workspace_id = $1 AND l.event_type = 'user.lead_merged' AND l.target_id = $2 AND p.user_id = (SELECT id FROM quills.customer_identity WHERE workspace_id = $1 AND kaneo_user_id = $3)`,
        [env().a, portal.principalId, person.id],
      );
      expect(audit[0].n).toBe(1);

      // A second link of the same profiles changes nothing.
      expect((await link(person.id)).body).toEqual({
        principalId: portal.principalId,
        mergedPrincipalId: null,
      });
      expect(await holders(ids)).toEqual(after);
      expect(await mergeEvents(portal.principalId)).toHaveLength(1);

      // The old widget session ends; the next identify with the same sub resolves to the merged profile.
      expect(
        (await call("GET", "/widget/session", { bearer: widgetSession }))
          .status,
      ).toBe(401);
      const again = await identify(sub, person.email);
      expect(again.status).toBe(200);
      expect(again.body).toMatchObject({
        principalId: portal.principalId,
        user: {
          id: portal.customerId,
          email: person.email,
          name: `Portal ${person.id}`,
        },
      });
      expect(again.body.votedPostIds.sort()).toEqual(
        [shared.postId, second.postId].sort(),
      );
      // Another sub with the same email does not reach the linked profile.
      expect((await identify(env().id("other"), person.email)).status).toBe(
        409,
      );

      // The portal pages show the widget history.
      const mine = await call("GET", "/portal/my-feedback?filter=voted", {
        user: person.id,
      });
      expect(mine.status).toBe(200);
      expect(
        mine.body.items.map((item: { id: string }) => item.id).sort(),
      ).toEqual([shared.postId, second.postId].sort());
      const support = await call("GET", "/support/conversations", {
        user: person.id,
      });
      expect(support.body.items.map((item: { id: string }) => item.id)).toEqual(
        [conversationId],
      );
      const myTickets = await call("GET", "/support/tickets", {
        user: person.id,
      });
      expect(JSON.stringify(myTickets.body)).toContain(ticketId);

      // Teammates see one customer with the combined history.
      const people = await call(
        "GET",
        `/users?${new URLSearchParams({ search: person.email })}`,
        { teammate: true },
      );
      expect(people.status).toBe(200);
      expect(people.body.items).toHaveLength(1);
      expect(people.body.items[0]).toMatchObject({
        principalId: portal.principalId,
        email: person.email,
        externalId: sub,
        voteCount: 2,
        commentCount: 1,
      });
      expect(
        (await call("GET", `/users/${widget}`, { teammate: true })).status,
      ).toBe(404);
    });

    it("links only a widget profile that asked from the widget, once", async () => {
      const person = await account(true);
      const unasked = await widgetProfile(env(), env().a, person.email);
      const clear = () =>
        pool.query(
          "DELETE FROM quills.kv_store WHERE workspace_id = $1 AND key LIKE 'widget:portal-link:%'",
          [env().a],
        );
      await clear();
      expect((await link(person.id)).body.mergedPrincipalId).toBeNull();
      expect(await profileOf(unasked.principalId)).toMatchObject({
        kaneoUserId: null,
      });
      // The request expires.
      await pool.query(
        `INSERT INTO quills.kv_store (workspace_id, workspace_key, key, value, expires_at)
         SELECT $1, '_', key, value, now() - interval '1 second' FROM (SELECT $2::text AS key, jsonb_build_object('principalId', $3::text) AS value) v`,
        [env().a, portalLinkKey(person.email), unasked.principalId],
      );
      expect((await link(person.id)).body.mergedPrincipalId).toBeNull();
      await clear();
    });

    it("keeps opt-outs, unsubscribe links, mentions and article counts through the link", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const person = await account(true);
      const portal = await env().portalCustomer(env().a, person.id);
      const widget = await widgetProfile(env(), env().a, person.email);
      const ids = await env().scoped(env().a, async (db, actor) => {
        // The widget profile unsubscribed from everything; the portal profile only from the digest.
        await db.insert(notificationPreferences).values([
          {
            principalId: widget.principalId as PrincipalId,
            emailMuted: true,
            matrix: { status_change: { email: false, inApp: true } },
          },
          {
            principalId: portal.principalId as PrincipalId,
            matrix: { weekly_digest: { email: false } },
          },
        ]);
        const [token] = await db
          .insert(unsubscribeTokens)
          .values({
            token: env().id("unsubscribe"),
            principalId: widget.principalId as PrincipalId,
            action: "unsubscribe_all",
            expiresAt: new Date(Date.now() + 86_400_000),
          })
          .returning({ id: unsubscribeTokens.id });
        await db.insert(postMentions).values({
          postId: widget.postId as PostId,
          principalId: widget.principalId as PrincipalId,
        });
        // Both profiles rated the same article helpful: one rating, one count, after the link.
        const [category] = await db
          .insert(helpCenterCategories)
          .values({ name: "Link", slug: env().id("category") })
          .returning({ id: helpCenterCategories.id });
        const [article] = await db
          .insert(helpCenterArticles)
          .values({
            categoryId: category!.id,
            title: "Link article",
            slug: env().id("article"),
            content: "Link",
            principalId: actor.principalId,
            helpfulCount: 2,
          })
          .returning({ id: helpCenterArticles.id });
        await db.insert(helpCenterArticleFeedback).values([
          {
            articleId: article!.id,
            principalId: widget.principalId as PrincipalId,
            helpful: true,
          },
          {
            articleId: article!.id,
            principalId: portal.principalId as PrincipalId,
            helpful: true,
          },
        ]);
        return { tokenId: token!.id, articleId: article!.id };
      });

      expect((await link(person.id)).body.mergedPrincipalId).toBe(
        widget.principalId,
      );
      const after = await env().scoped(env().a, async (db) => ({
        preferences: await db
          .select({
            principalId: notificationPreferences.principalId,
            emailMuted: notificationPreferences.emailMuted,
            matrix: notificationPreferences.matrix,
          })
          .from(notificationPreferences)
          .where(
            inArray(notificationPreferences.principalId, [
              widget.principalId as PrincipalId,
              portal.principalId as PrincipalId,
            ]),
          ),
        token: (
          await db
            .select({ principalId: unsubscribeTokens.principalId })
            .from(unsubscribeTokens)
            .where(eq(unsubscribeTokens.id, ids.tokenId))
        )[0]?.principalId,
        mentions: (
          await db
            .select({ principalId: postMentions.principalId })
            .from(postMentions)
            .where(eq(postMentions.postId, widget.postId as PostId))
        ).map((row) => row.principalId),
        article: (
          await db
            .select({ helpful: helpCenterArticles.helpfulCount })
            .from(helpCenterArticles)
            .where(eq(helpCenterArticles.id, ids.articleId))
        )[0]?.helpful,
        ratings: (
          await db
            .select({ principalId: helpCenterArticleFeedback.principalId })
            .from(helpCenterArticleFeedback)
            .where(eq(helpCenterArticleFeedback.articleId, ids.articleId))
        ).map((row) => row.principalId),
      }));
      expect(after.preferences).toEqual([
        {
          principalId: portal.principalId,
          emailMuted: true,
          matrix: {
            status_change: { email: false, inApp: true },
            weekly_digest: { email: false },
          },
        },
      ]);
      expect(after.token).toBe(portal.principalId);
      expect(after.mentions).toEqual([portal.principalId]);
      expect(after.ratings).toEqual([portal.principalId]);
      expect(after.article).toBe(1);
    });

    it("never replaces the sub that an earlier link gave the profile", async () => {
      const person = await account(true);
      const first = await widgetProfile(env(), env().a, person.email);
      const merged = (await link(person.id)).body.principalId as string;
      expect(await profileOf(merged)).toMatchObject({ externalId: first.sub });
      // The Kaneo account moves to another verified address that another widget profile holds.
      const moved = `${person.id}-new@example.test`;
      await env()
        .db.update(kaneo.userTable)
        .set({ email: moved })
        .where(eq(kaneo.userTable.id, person.id));
      const second = await widgetProfile(env(), env().a, moved);
      expect((await link(person.id)).body.mergedPrincipalId).toBeNull();
      expect(await profileOf(merged)).toMatchObject({ externalId: first.sub });
      expect(await profileOf(second.principalId)).toMatchObject({
        externalId: second.sub,
        kaneoUserId: null,
      });
    });

    it("keeps a linked profile's email and sub out of teammates' and the host's reach", async () => {
      const person = await account(true);
      const widget = await widgetProfile(env(), env().a, person.email);
      const merged = (await link(person.id)).body.principalId as string;
      for (const body of [
        { externalId: env().id("taken") },
        { email: `${env().id("taken")}@example.test` },
        { emailVerified: false },
      ])
        expect(
          (await call("PUT", `/users/${merged}`, { teammate: true, body }))
            .status,
        ).toBe(409);
      // The name still changes.
      expect(
        (
          await call("PUT", `/users/${merged}`, {
            teammate: true,
            body: { name: "Renamed by a teammate" },
          })
        ).status,
      ).toBe(200);
      // The host's token with the linked sub but another email does not reach the profile.
      expect(
        (await identify(widget.sub, `${env().id("other")}@example.test`))
          .status,
      ).toBe(409);
      expect((await identify(widget.sub, person.email)).body.principalId).toBe(
        merged,
      );
    });

    it("serializes a link with a concurrent identify of the same visitor", async () => {
      for (let round = 0; round < 3; round++) {
        const person = await account(true);
        const sub = env().id("sub");
        const first = await identify(sub, person.email);
        expect(
          (
            await call("POST", "/widget/portal-link", {
              bearer: first.body.sessionToken,
            })
          ).status,
        ).toBe(200);
        const [linked, identified] = await Promise.all([
          link(person.id),
          identify(sub, person.email),
        ]);
        expect(linked.status).toBe(200);
        expect(identified.status).toBe(200);
        const merged = linked.body.principalId as string;
        expect(linked.body.mergedPrincipalId).toBe(first.body.principalId);
        // Whichever ran first, the sub now names only the portal profile.
        const holders = await env().scoped(env().a, (db) =>
          db
            .select({ kaneoUserId: customer.kaneoUserId })
            .from(customer)
            .where(eq(customer.externalId, sub)),
        );
        expect(holders).toEqual([{ kaneoUserId: person.id }]);
        expect((await identify(sub, person.email)).body.principalId).toBe(
          merged,
        );
      }
    });

    it("rejects an expired sign-in link", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const person = await account(false);
      const identified = await identify(env().id("sub"), person.email);
      const sent = await call("POST", "/widget/portal-link", {
        bearer: identified.body.sessionToken,
      });
      expect(sent.status).toBe(200);
      const mail = await signInLink(person.email);
      await pool.query(
        "UPDATE public.verification SET expires_at = now() - interval '1 second' WHERE identifier = $1",
        [`magic-link:${mail.token}`],
      );
      const opened = await open(mail.url);
      expect(opened.location).toContain("error=INVALID_TOKEN");
      expect(opened.session).toBe(false);
      const [row] = await env()
        .db.select({ emailVerified: kaneo.userTable.emailVerified })
        .from(kaneo.userTable)
        .where(eq(kaneo.userTable.id, person.id));
      expect(row!.emailVerified).toBe(false);
    });

    it("does not link a profile of the same email in another workspace", async () => {
      const person = await account(true);
      const elsewhere = await widgetProfile(env(), env().b, person.email);
      const res = await link(person.id);
      expect(res.status).toBe(200);
      expect(res.body.mergedPrincipalId).toBeNull();
      const [kept] = await env().scoped(env().b, (db) =>
        db
          .select({ email: customer.email, kaneoUserId: customer.kaneoUserId })
          .from(customer)
          .where(
            eq(
              customer.id,
              elsewhere.customerId as typeof customer.$inferSelect.id,
            ),
          ),
      );
      expect(kept).toEqual({ email: person.email, kaneoUserId: null });
      // The account's own workspace B link still works there.
      expect((await link(person.id, env().b)).body.mergedPrincipalId).toBe(
        elsewhere.principalId,
      );
    });

    it("does not link a blocked widget profile, and a blocked portal customer cannot link", async () => {
      const person = await account(true);
      const blocked = await widgetProfile(env(), env().a, person.email);
      const block = (principalId: string, at: Date | null) =>
        env().scoped(env().a, (db) =>
          db
            .update(principal)
            .set({ blockedAt: at })
            .where(eq(principal.id, principalId as PrincipalId)),
        );
      await block(blocked.principalId, new Date());
      expect((await link(person.id)).body.mergedPrincipalId).toBeNull();
      expect(await profileOf(blocked.principalId)).toMatchObject({
        email: person.email,
        kaneoUserId: null,
      });

      await block(blocked.principalId, null);
      const portal = await env().portalCustomer(env().a, person.id);
      await block(portal.principalId, new Date());
      expect((await link(person.id)).status).toBe(403);
      expect(await profileOf(blocked.principalId)).toMatchObject({
        kaneoUserId: null,
      });
    });
  },
);
