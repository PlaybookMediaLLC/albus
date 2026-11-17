import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PostId, PrincipalId } from "@kaneo/ids";
import { principal, user as customer } from "../../database/quills/schema/auth";
import {
  conversationMessages,
  conversations,
} from "../../database/quills/schema/conversation";
import { emailLog } from "../../database/quills/schema/email-log";
import { postExternalLinks } from "../../database/quills/schema/external-links";
import {
  notificationPreferences,
  postSubscriptions,
} from "../../database/quills/schema/notifications";
import { postUpdates } from "../../database/quills/schema/post-updates";
import { boards } from "../../database/quills/schema/boards";
import { postComments, posts } from "../../database/quills/schema/posts";
import { segments, userSegments } from "../../database/quills/schema/segments";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import { drainQuillsWorkspace } from "../jobs/worker";
import {
  customerPost,
  enablePortal,
  verifyEmail,
} from "../portal/customer-seed.fixture";
import { restrictedMember } from "./taxonomy-harness.fixture";

// "Send update" (#92) under a real database: the preview counts what the send delivers, the release
// gate, targeting, idempotency, the conversation reply and permissions. The mail provider is the only fake.

const mail = vi.hoisted(() => ({
  sent: [] as { to: string; body: string; postTitle: string }[],
}));
vi.mock("@kaneo/email/quills", async (original) => ({
  ...(await original<typeof import("@kaneo/email/quills")>()),
  sendPostUpdateEmail: vi.fn(async (params: (typeof mail.sent)[number]) => {
    mail.sent.push(params);
    return { sent: true };
  }),
}));

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
vi.mock("../../ws", () => ({
  broadcastToUserAndWait: vi.fn(async () => {}),
}));

const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter);
const all = { page: true, email: true, conversations: true, slack: false };

async function drain() {
  for (let pass = 0; pass < 20; pass++) {
    const { processed, failed } = await drainQuillsWorkspace(
      contractEnv().a,
      async () => {},
    );
    if (!processed && !failed) return;
  }
}
const call = (path: string, body: unknown, user = contractEnv().owner) =>
  Promise.resolve(
    app.request(`/quills/${contractEnv().a}${path}`, {
      method: "POST",
      headers: { "x-test-user": user, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  ).then(async (res) => ({ status: res.status, body: await res.json() }));

describe.skipIf(!url)("Quills send update", () => {
  let post: { postId: string; title: string };
  let other: { postId: string; title: string };
  let segmentId: string;
  let conversationId: string;
  const people: Record<string, { principalId: PrincipalId; email: string }> =
    {};
  const preview = (body: Record<string, unknown>, postId = post.postId) =>
    call(`/posts/${postId}/updates/preview`, body);
  const send = (body: Record<string, unknown>, postId = post.postId) =>
    call(`/posts/${postId}/updates`, {
      segmentIds: [],
      languages: [],
      body: "CSV export shipped today.",
      confirmRelease: true,
      idempotencyKey: contractEnv().id("update"),
      ...body,
    });
  const updateMail = () =>
    contractEnv().scoped(contractEnv().a, (db) =>
      db
        .select({ to: emailLog.address })
        .from(emailLog)
        .where(eq(emailLog.emailType, "PostUpdateEmail")),
    );

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
    const env = contractEnv();
    await enablePortal(env, env.a);
    post = await customerPost(env, env.a);
    other = await customerPost(env, env.a);
    for (const name of [
      "french",
      "english",
      "statusOff",
      "muted",
      "blocked",
      "chatter",
    ]) {
      const visitor = await env.widgetVisitor(env.a);
      const [row] = await env.scoped(env.a, (db) =>
        db
          .select({ email: customer.email, customerId: customer.id })
          .from(principal)
          .innerJoin(customer, eq(customer.id, principal.userId))
          .where(eq(principal.id, visitor.principalId as PrincipalId)),
      );
      people[name] = {
        principalId: visitor.principalId as PrincipalId,
        email: row!.email!,
      };
      await env.scoped(env.a, (db) =>
        db
          .update(customer)
          .set({ preferredLanguage: name === "french" ? "fr-CA" : "en" })
          .where(eq(customer.id, row!.customerId)),
      );
    }
    const customerA = (await env.portalCustomer(env.a, env.customerA))
      .principalId as PrincipalId;
    await verifyEmail(env, env.customerA);
    const owner = await env.scoped(
      env.a,
      async (_db, actor) => actor.principalId,
    );
    await env.scoped(env.a, async (db) => {
      const follow = (
        principalId: PrincipalId,
        notifyStatusChanges = true,
      ) => ({
        postId: post.postId as PostId,
        principalId,
        reason: "manual" as const,
        notifyStatusChanges,
      });
      await db.insert(postSubscriptions).values([
        follow(people.french!.principalId),
        follow(people.english!.principalId),
        follow(people.statusOff!.principalId, false),
        follow(people.muted!.principalId),
        follow(people.blocked!.principalId),
        follow(people.chatter!.principalId),
        follow(customerA),
        // A teammate follower hears it in the app, never by update mail.
        follow(owner),
      ]);
      await db
        .insert(notificationPreferences)
        .values({ principalId: people.muted!.principalId, emailMuted: true });
      await db
        .update(principal)
        .set({ blockedAt: new Date() })
        .where(eq(principal.id, people.blocked!.principalId));
      const [segment] = await db
        .insert(segments)
        .values({ name: "Beta", slug: env.id("segment") })
        .returning({ id: segments.id });
      segmentId = segment!.id;
      await db.insert(userSegments).values({
        principalId: people.english!.principalId,
        segmentId: segment!.id,
      });
      const [conversation] = await db
        .insert(conversations)
        .values({
          visitorPrincipalId: people.chatter!.principalId,
          channel: "messenger",
        })
        .returning({ id: conversations.id });
      conversationId = conversation!.id;
      await db.insert(postExternalLinks).values({
        postId: post.postId as PostId,
        integrationType: "live_chat",
        externalId: conversation!.id,
        origin: "reference",
      });
    });
  }, 120000);
  afterAll(async () => {
    vi.unstubAllEnvs();
    await stopContract();
  });

  it("sends nothing without a release confirmation", async () => {
    const refused = await send({ channels: all, confirmRelease: false });
    expect(refused.status).toBe(409);
    const rows = await contractEnv().scoped(contractEnv().a, (db) =>
      db.select({ id: postUpdates.id }).from(postUpdates),
    );
    expect(rows).toEqual([]);
  });

  it("refuses a teammate without manage_settings", async () => {
    const member = await restrictedMember(contractEnv(), []);
    expect((await preview({ channels: all })).status).toBe(200);
    expect(
      (
        await call(
          `/posts/${post.postId}/updates/preview`,
          { channels: all },
          member,
        )
      ).status,
    ).toBe(403);
  });

  it("counts by language and segment, and refuses an unknown segment", async () => {
    expect(
      (await preview({ channels: all, languages: ["fr"] })).body.counts,
    ).toMatchObject({ email: 1, conversations: 0 });
    expect(
      (await preview({ channels: all, segmentIds: [segmentId] })).body.counts,
    ).toMatchObject({ email: 1, conversations: 0 });
    const unknown = await preview({
      channels: all,
      segmentIds: ["segment_01h455vb4pex5vsknk084sn02q"],
    });
    expect(unknown.status).toBe(404);
    expect(
      (await preview({ channels: { ...all, email: false } })).body.counts.email,
    ).toBe(0);
  });

  it("leaves out a follower who can no longer see the request", async () => {
    const env = contractEnv();
    const restrict = (segmentIds: string[] | null) =>
      env.scoped(env.a, async (db) => {
        const [row] = await db
          .select({ boardId: posts.boardId })
          .from(posts)
          .where(eq(posts.id, post.postId as PostId));
        await db
          .update(boards)
          .set({ visibleSegmentIds: segmentIds })
          .where(eq(boards.id, row!.boardId));
      });
    // Only the Beta segment (the English follower) may see the board now.
    await restrict([segmentId]);
    try {
      expect(
        (await preview({ channels: { ...all, conversations: false } })).body
          .counts.email,
      ).toBe(1);
    } finally {
      await restrict(null);
    }
  });

  it("delivers exactly what the preview counted, once, and replies in the linked conversation", async () => {
    const env = contractEnv();
    const counted = await preview({ channels: all });
    expect(counted.status).toBe(200);
    // french, english and customer A; the chatter gets the conversation reply instead.
    expect(counted.body.counts).toEqual({
      page: 1,
      email: 3,
      conversations: 1,
      slack: 0,
    });
    const key = env.id("update-once");
    const sent = await send({ channels: all, idempotencyKey: key });
    expect(sent.status).toBe(200);
    expect(sent.body).toMatchObject({
      counts: counted.body.counts,
      replayed: false,
      commentId: expect.any(String),
      replies: [{ messageId: expect.any(String), conversationId }],
    });
    // Nothing is mailed before the worker delivers the committed event.
    expect(mail.sent).toEqual([]);
    await drain();
    expect(mail.sent.map((one) => one.to).sort()).toEqual(
      [
        people.french!.email,
        people.english!.email,
        `${env.customerA}@example.test`,
      ].sort(),
    );
    expect(mail.sent[0]).toMatchObject({
      body: "CSV export shipped today.",
      postTitle: post.title,
    });
    expect(await updateMail()).toHaveLength(counted.body.counts.email);

    const comments = await env.scoped(env.a, (db) =>
      db
        .select({
          isTeamMember: postComments.isTeamMember,
          isPrivate: postComments.isPrivate,
        })
        .from(postComments)
        .where(eq(postComments.postId, post.postId as PostId)),
    );
    expect(comments).toEqual([{ isTeamMember: true, isPrivate: false }]);
    const replies = await env.scoped(env.a, (db) =>
      db
        .select({ content: conversationMessages.content })
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId as never),
            eq(conversationMessages.senderType, "agent"),
          ),
        ),
    );
    expect(replies).toEqual([{ content: "CSV export shipped today." }]);
    const [thread] = await env.scoped(env.a, (db) =>
      db
        .select({
          status: conversations.status,
          assigned: conversations.assignedAgentPrincipalId,
        })
        .from(conversations)
        .where(eq(conversations.id, conversationId as never)),
    );
    expect(thread).toEqual({ status: "open", assigned: null });

    // The same key again: the first send, and nothing new.
    const again = await send({ channels: all, idempotencyKey: key });
    expect(again.body).toEqual({
      updateId: sent.body.updateId,
      counts: sent.body.counts,
      replayed: true,
      commentId: null,
      replies: [],
    });
    await drain();
    expect(mail.sent).toHaveLength(3);
    expect(await updateMail()).toHaveLength(3);
    const [{ count }] = await env.scoped(env.a, (db) =>
      db
        .select({ count: postComments.id })
        .from(postComments)
        .where(eq(postComments.postId, post.postId as PostId))
        .then((rows) => [{ count: rows.length }]),
    );
    expect(count).toBe(1);
    // A key that belongs to another request.
    expect(
      (await send({ channels: all, idempotencyKey: key }, other.postId)).status,
    ).toBe(409);
  });
});
