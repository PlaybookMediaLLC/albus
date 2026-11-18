import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { and, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import {
  assistantInvolvements,
  assistantSnippets,
} from "../../database/quills/schema/assistant";
import {
  conversationMessages,
  conversations,
} from "../../database/quills/schema/conversation";
import {
  knowledgeQuestions,
  knowledgeSources,
  knowledgeSuggestions,
} from "../../database/quills/schema/knowledge-suggestions";
import { jobQueue } from "../../database/quills/schema/job-queue";
import type { BaseVariables } from "../../openapi";
import router from "..";
import { harness } from "../jobs/handlers/harness.fixture";
import {
  conversation,
  customer,
  testCustomer,
} from "../support/conversation-seed.fixture";
import { chatReply, EMBEDDING, provider } from "./provider-edge.fixture";

// "Teach the AI" (issue #275, phase 3): the review job on a closed conversation, the questions,
// the draft job and the review routes. Real PostgreSQL, the local provider server, workspaces A, B.

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
vi.mock("../../ws", () => ({ broadcastToUserAndWait: vi.fn(async () => {}) }));

const url = process.env.QUILLS_TEST_DATABASE_URL;
const h = harness("teach");
const app = new Hono<{ Variables: BaseVariables & { workspaceId: string } }>();
app.use("*", async (c, next) => {
  c.set("userId", c.req.header("x-user")!);
  c.set("user", null);
  await next();
});
app.route("/quills", router);
app.onError((error, c) =>
  error instanceof HTTPException
    ? c.json({ message: error.message }, error.status)
    : c.json({ message: "Internal error" }, 500),
);
const call = async (
  user: string,
  path: string,
  method = "GET",
  body?: unknown,
) => {
  const res = await app.request(`/quills/${h.a}${path}`, {
    method,
    headers: {
      "x-user": user,
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    body: (await res.json().catch(() => null)) as any,
  };
};

type Knowledge = { topic: string; title: string; content: string } | null;
/**
 * The local provider answers each teach prompt from the script; the judge says "same" when both
 * titles are equal. Embeddings are all EMBEDDING, so every earlier suggestion is close.
 */
const script = (
  knowledge: Knowledge,
  questions: { question: string; suggestedAnswers: string[] }[] = [],
) =>
  provider.reply(({ path, body }) => {
    if (path.endsWith("/embeddings"))
      return {
        json: {
          data: body.input.map((_: string, index: number) => ({
            index,
            embedding: EMBEDDING,
          })),
        },
      };
    const system: string = body.messages[0].content;
    const user: string = body.messages.at(-1).content;
    // The feedback autopilot runs first on the same event (jobs/handlers/signals.ts).
    if (system.includes("Find the concrete feature requests"))
      return chatReply({ requests: [] });
    if (system.includes("closed support conversation"))
      return chatReply({ knowledge });
    if (system.includes("Ask at most three short questions"))
      return chatReply({ questions });
    if (system.includes("give the same guidance")) {
      const first = (label: string) =>
        user.match(new RegExp(`<${label}>\\n([^\\n]*)`))?.[1];
      return chatReply({ same: first("new") === first("existing") });
    }
    if (system.includes("Write the final knowledge snippet"))
      return chatReply({
        title: "Refunds (final)",
        content: "Refunds take five days on all plans.",
      });
    return chatReply({});
  });
const prompts = (marker: string) =>
  provider.requests
    .filter(
      (r) =>
        r.path.endsWith("/chat/completions") &&
        r.body.messages[0].content.includes(marker),
    )
    .map((r) => r.body.messages as { role: string; content: string }[]);

/** A closed conversation in A: the seed's customer, reply and note, plus the given messages. */
const closed = async (
  extra: {
    senderType: "visitor" | "agent";
    principal: "teammate" | "ai" | "customer";
    content: string;
    internal?: boolean;
  }[] = [],
) => {
  const id = await h.as(h.a, h.owner, async (db, actor) => {
    const visitor = await customer(db, `${crypto.randomUUID()}@example.test`);
    const { conversationId } = await conversation(
      db,
      actor.principalId,
      visitor,
    );
    for (const message of extra)
      await db.insert(conversationMessages).values({
        conversationId: conversationId as never,
        principalId: (message.principal === "teammate"
          ? actor.principalId
          : message.principal === "customer"
            ? visitor
            : null) as never,
        senderType: message.senderType,
        content: message.content,
        isInternal: message.internal ?? false,
      });
    await db
      .update(conversations)
      .set({ status: "closed" })
      .where(eq(conversations.id, conversationId as never));
    return conversationId as string;
  });
  return id;
};
const review = async (conversationId: string) => {
  await h.emit(h.a, {
    type: "conversation.status_changed",
    entityType: "conversation",
    entityId: conversationId,
  });
  await h.drain(h.a);
};
const suggestionsOf = () =>
  h.system(h.a, (db) => db.select().from(knowledgeSuggestions));
const sourceOf = async (conversationId: string) =>
  (
    await h.system(h.a, (db) =>
      db
        .select()
        .from(knowledgeSources)
        .where(eq(knowledgeSources.conversationId, conversationId as never)),
    )
  )[0];
const refunds = (topic = "How long do refunds take") => ({
  topic,
  title: "Refunds",
  content: "Refunds take five days.",
});

describe.skipIf(!url)("Teach the AI", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 6 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    await h.stop();
    await pool?.end();
  });
  beforeEach(async () => {
    provider.reply();
    provider.requests.length = 0;
    await h.system(h.a, async (db) => {
      await db.delete(knowledgeSources);
      await db.delete(knowledgeSuggestions);
    });
  });

  it("learns from the teammate's answer only: no AI replies, no internal notes, personal data redacted", async () => {
    script(refunds(), [
      { question: "Which plans?", suggestedAnswers: ["All plans"] },
    ]);
    const id = await closed([
      { senderType: "agent", principal: "ai", content: "AI-ONLY-REPLY" },
      {
        senderType: "agent",
        principal: "teammate",
        content: "Refunds take five days. Write to ana@example.com",
      },
    ]);
    await review(id);

    const [extract] = prompts("closed support conversation");
    const text = extract![1]!.content;
    expect(text).toContain(
      "Teammate: Refunds take five days. Write to [email]",
    );
    expect(text).not.toContain("AI-ONLY-REPLY");
    expect(text).not.toContain("Private context");
    expect(text).not.toContain("ana@example.com");

    const [suggestion] = await suggestionsOf();
    expect(suggestion).toMatchObject({
      status: "awaiting_answer",
      gap: false,
      questionCount: 1,
      evidenceCount: 1,
    });
    const questions = await h.system(h.a, (db) =>
      db.select().from(knowledgeQuestions),
    );
    expect(questions).toMatchObject([
      {
        position: 0,
        question: "Which plans?",
        suggestedAnswers: ["All plans"],
      },
    ]);
    expect(await sourceOf(id)).toMatchObject({
      outcome: "created",
      suggestionId: suggestion!.id,
    });
  });

  it("marks a conversation that the customer agent could not answer as a gap, and lists it first", async () => {
    // The gap comes first and the plain one is newer, so only the gap rule can list the gap first.
    script({
      topic: "Change the billing email",
      title: "Billing email",
      content: "Change it in Settings.",
    });
    const gap = await closed();
    await h.as(h.a, h.owner, (db) =>
      db.insert(assistantInvolvements).values({
        conversationId: gap as never,
        triggeredBy: "first_touch",
        status: "handed_off",
        handoffReason: "capability_limit",
      } as never),
    );
    await review(gap);
    script(refunds("Export data to CSV"));
    const plain = await closed();
    await review(plain);
    const list = await call(h.owner, "/assistant/knowledge-suggestions");
    expect(list.status).toBe(200);
    expect(
      list.body.items.map(
        (item: {
          title: string | null;
          candidateTitle: string;
          gap: boolean;
        }) => [item.candidateTitle, item.gap],
      ),
    ).toEqual([
      ["Billing email", true],
      ["Refunds", false],
    ]);
  });

  it("skips a conversation without a teammate reply, and reviews each conversation once", async () => {
    script(refunds());
    // The seed's conversation without its teammate messages: only the customer wrote.
    const quiet = await closed();
    await h.as(h.a, h.owner, (db) =>
      db
        .delete(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, quiet as never),
            eq(conversationMessages.senderType, "agent"),
          ),
        ),
    );
    await review(quiet);
    expect(prompts("closed support conversation")).toEqual([]);
    expect(await sourceOf(quiet)).toMatchObject({ outcome: "none" });

    const answered = await closed();
    await review(answered);
    const calls = provider.requests.length;
    await review(answered);
    expect(provider.requests.length).toBe(calls);
    expect(await suggestionsOf()).toHaveLength(1);
  });

  it("adds evidence to an open suggestion, and never suggests a dismissed topic again", async () => {
    script(refunds());
    await review(await closed());
    await review(await closed());
    let [suggestion] = await suggestionsOf();
    expect(suggestion!.evidenceCount).toBe(2);

    expect(
      (
        await call(
          h.owner,
          `/assistant/knowledge-suggestions/${suggestion!.id}/dismiss`,
          "POST",
        )
      ).status,
    ).toBe(200);
    const third = await closed();
    await review(third);
    expect(await sourceOf(third)).toMatchObject({ outcome: "discarded" });
    [suggestion] = await suggestionsOf();
    expect(suggestion).toMatchObject({ status: "dismissed", evidenceCount: 2 });
    expect(await suggestionsOf()).toHaveLength(1);
  });

  it("creates nothing when the model finds no durable fact", async () => {
    script(null);
    const id = await closed();
    await review(id);
    expect(await suggestionsOf()).toEqual([]);
    expect(await sourceOf(id)).toMatchObject({ outcome: "none" });
  });

  it("skips a test customer's conversation, and a provider failure never fails the shared job", async () => {
    script(refunds());
    const tested = await closed();
    await h.as(h.a, h.owner, async (db, actor) => {
      const visitor = await testCustomer(
        db,
        actor.principalId,
        `${crypto.randomUUID()}@example.test`,
      );
      await db
        .update(conversations)
        .set({ visitorPrincipalId: visitor as never })
        .where(eq(conversations.id, tested as never));
    });
    await review(tested);
    expect(prompts("closed support conversation")).toEqual([]);
    expect(await sourceOf(tested)).toBeUndefined();

    // The review fails at the provider; the feedback autopilot in the same job still succeeds.
    provider.reply(({ body }) =>
      String(body?.messages?.[0]?.content ?? "").includes(
        "Find the concrete feature requests",
      )
        ? chatReply({ requests: [] })
        : { status: 503, json: {} },
    );
    const since = new Date();
    const failing = await closed();
    await review(failing);
    expect(await sourceOf(failing)).toBeUndefined();
    const jobs = await h.system(h.a, (db) =>
      db
        .select({ status: jobQueue.status })
        .from(jobQueue)
        .where(
          and(eq(jobQueue.queue, "quills.ai"), gte(jobQueue.updatedAt, since)),
        ),
    );
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((job) => job.status === "succeeded")).toBe(true);
    // Without a source row, a later close reviews it again.
    script(refunds());
    await review(failing);
    expect(await sourceOf(failing)).toMatchObject({ outcome: "created" });
  });

  it("never sends a deleted message to the provider", async () => {
    script(refunds());
    const id = await closed([
      {
        senderType: "agent",
        principal: "teammate",
        content: "DELETED-WRONG-ANSWER",
      },
    ]);
    await h.as(h.a, h.owner, (db) =>
      db
        .update(conversationMessages)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(conversationMessages.conversationId, id as never),
            eq(conversationMessages.content, "DELETED-WRONG-ANSWER"),
          ),
        ),
    );
    await review(id);
    const [extract] = prompts("closed support conversation");
    expect(extract![1]!.content).not.toContain("DELETED-WRONG-ANSWER");
  });

  it("keeps the AI's first text as the draft when the draft call fails", async () => {
    script(refunds(), [{ question: "Which plans?", suggestedAnswers: [] }]);
    await review(await closed());
    const [suggestion] = await suggestionsOf();
    const path = `/assistant/knowledge-suggestions/${suggestion!.id}`;
    provider.reply(() => ({ status: 503, json: {} }));
    await call(h.owner, `${path}/answer`, "POST", {
      stepIndex: 0,
      answer: "All plans",
    });
    await h.drain(h.a);
    expect((await call(h.owner, path)).body).toMatchObject({
      status: "draft_ready",
      title: "Refunds",
      content: "Refunds take five days.",
    });
  });

  it("asks the questions, drafts after the last one, and approves into a team snippet", async () => {
    script(refunds(), [
      { question: "Which plans?", suggestedAnswers: ["All plans"] },
      { question: "Any exception?", suggestedAnswers: [] },
    ]);
    await review(await closed());
    const [suggestion] = await suggestionsOf();
    const path = `/assistant/knowledge-suggestions/${suggestion!.id}`;

    expect(
      (await call(h.owner, `${path}/approve`, "POST", { audience: "team" }))
        .status,
    ).toBe(409);
    expect(
      (
        await call(h.owner, `${path}/answer`, "POST", {
          stepIndex: 0,
          answer: "x",
          skip: true,
        })
      ).status,
    ).toBe(400);
    const first = await call(h.owner, `${path}/answer`, "POST", {
      stepIndex: 0,
      answer: "All plans",
    });
    expect(first.body).toMatchObject({
      status: "awaiting_answer",
      stepIndex: 1,
    });
    // A teammate on a stale screen answers question 1 again: refused, not filed under question 2.
    expect(
      (
        await call(h.owner, `${path}/answer`, "POST", {
          stepIndex: 0,
          answer: "Pro only",
        })
      ).status,
    ).toBe(409);
    const second = await call(h.owner, `${path}/answer`, "POST", {
      stepIndex: 1,
      skip: true,
    });
    expect(second.body).toMatchObject({ status: "drafting", stepIndex: 2 });
    expect(second.body.questions).toMatchObject([
      { answer: "All plans", skipped: false },
      { answer: null, skipped: true },
    ]);

    await h.drain(h.a);
    const [draftPrompt] = prompts("Write the final knowledge snippet");
    expect(draftPrompt![1]!.content).toContain("Answer: All plans");
    expect(draftPrompt![1]!.content).toContain("Answer: (skipped)");
    const detail = await call(h.owner, path);
    expect(detail.body).toMatchObject({
      status: "draft_ready",
      title: "Refunds (final)",
    });
    expect(
      (
        await call(h.owner, `${path}/answer`, "POST", {
          stepIndex: 2,
          answer: "late",
        })
      ).status,
    ).toBe(409);

    const edited = await call(h.owner, path, "PATCH", {
      content: "Refunds take five days on every plan.",
    });
    expect(edited.body.content).toBe("Refunds take five days on every plan.");
    const approved = await call(h.owner, `${path}/approve`, "POST", {
      audience: "team",
    });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("approved");
    const [snippet] = await h.system(h.a, (db) =>
      db
        .select()
        .from(assistantSnippets)
        .where(eq(assistantSnippets.id, approved.body.approvedSnippetId)),
    );
    expect(snippet).toMatchObject({
      title: "Refunds (final)",
      content: "Refunds take five days on every plan.",
      audience: "team",
      enabled: true,
    });
    expect(
      (await call(h.owner, `${path}/approve`, "POST", { audience: "team" }))
        .status,
    ).toBe(409);
    expect((await call(h.owner, `${path}/dismiss`, "POST")).status).toBe(409);
  });

  it("approves into a public snippet when asked, and keeps workspace B out", async () => {
    script(refunds(), []);
    await review(await closed());
    const [suggestion] = await suggestionsOf();
    expect(suggestion!.status).toBe("draft_ready");
    const approved = await call(
      h.owner,
      `/assistant/knowledge-suggestions/${suggestion!.id}/approve`,
      "POST",
      { audience: "public" },
    );
    const [snippet] = await h.system(h.a, (db) =>
      db
        .select()
        .from(assistantSnippets)
        .where(eq(assistantSnippets.id, approved.body.approvedSnippetId)),
    );
    expect(snippet!.audience).toBe("public");
    const inB = await h.system(h.b, (db) =>
      db
        .select()
        .from(knowledgeSuggestions)
        .where(and(eq(knowledgeSuggestions.id, suggestion!.id))),
    );
    expect(inB).toEqual([]);
  });

  it("refuses the review routes to a teammate without manage_settings", async () => {
    expect(
      (await call(h.mate, "/assistant/knowledge-suggestions")).status,
    ).toBe(403);
  });
});
