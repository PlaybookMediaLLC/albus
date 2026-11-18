import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import { assistantDocuments } from "../../database/quills/schema/assistant";
import {
  knowledgeSources,
  knowledgeSuggestions,
} from "../../database/quills/schema/knowledge-suggestions";
import type { BaseVariables } from "../../openapi";
import router from "..";
import { harness } from "../jobs/handlers/harness.fixture";
import { chatReply, provider } from "./provider-edge.fixture";

// FAQ suggestions from a knowledge document (engine/document-faq.ts) on real PostgreSQL with the
// local provider.

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
const h = harness("docfaq");
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
const addDocument = async (title: string) => {
  const res = await app.request(`/quills/${h.a}/assistant/documents`, {
    method: "POST",
    headers: { "x-user": h.owner, "content-type": "application/json" },
    body: JSON.stringify({
      title,
      fileName: "policy.md",
      mimeType: "text/markdown",
      content: "Refunds are available within 30 days. Shipping takes 2 days.",
    }),
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { id: string }).id;
};
const embeddings = (input: string[]) => ({
  json: {
    data: input.map((_, index) => ({
      index,
      embedding: Array.from({ length: 1536 }, (_, i) => (i === index ? 1 : 0)),
    })),
    usage: { prompt_tokens: 2, total_tokens: 2 },
  },
});
const sourcesOf = (documentId: string) =>
  h.system(h.a, (db) =>
    db
      .select({
        outcome: knowledgeSources.outcome,
        suggestionId: knowledgeSources.suggestionId,
      })
      .from(knowledgeSources)
      .where(eq(knowledgeSources.documentId, documentId as never)),
  );

describe.skipIf(!url)("document FAQ suggestions", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 4 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    await h.stop();
    await pool?.end();
  });
  beforeEach(() => {
    provider.requests.length = 0;
  });

  it("turns a new document's FAQ items into ready drafts, once", async () => {
    const topic = `How long do refunds take ${crypto.randomUUID().slice(0, 6)}?`;
    provider.reply(({ path, body }) =>
      path.endsWith("/embeddings")
        ? embeddings(body.input as string[])
        : chatReply({
            items: [
              {
                topic,
                title: "Refund window",
                content: "Refunds are available within 30 days.",
              },
            ],
          }),
    );
    const id = await addDocument("Returns policy");
    await h.drain(h.a);
    const [source] = await sourcesOf(id);
    expect(source).toMatchObject({ outcome: "created" });
    const [suggestion] = await h.system(h.a, (db) =>
      db
        .select({
          status: knowledgeSuggestions.status,
          title: knowledgeSuggestions.title,
          questionCount: knowledgeSuggestions.questionCount,
        })
        .from(knowledgeSuggestions)
        .where(eq(knowledgeSuggestions.id, source!.suggestionId!)),
    );
    expect(suggestion).toEqual({
      status: "draft_ready",
      title: "Refund window",
      questionCount: 0,
    });
    // The document is read into the prompt inside the data fence.
    const extract = provider.requests.find((r) =>
      JSON.stringify(r.body).includes("knowledge document"),
    );
    expect(JSON.stringify(extract!.body)).toContain("Shipping takes 2 days.");

    // The same event again reads nothing new.
    provider.requests.length = 0;
    await h.emit(h.a, {
      type: "assistant_document.created",
      entityType: "assistant_document",
      entityId: id,
    });
    await h.drain(h.a);
    expect(await sourcesOf(id)).toHaveLength(1);
    expect(
      provider.requests.filter((r) => r.path.endsWith("/chat/completions")),
    ).toHaveLength(0);
  });

  it("keeps the document's embedding when the FAQ step fails", async () => {
    provider.reply(({ path, body }) =>
      path.endsWith("/embeddings")
        ? embeddings(body.input as string[])
        : { status: 503, json: {} },
    );
    const id = await addDocument("Shipping policy");
    await h.drain(h.a);
    expect(await sourcesOf(id)).toEqual([]);
    const embedded = await h.system(h.a, (db) =>
      db
        .select({ id: assistantDocuments.id })
        .from(assistantDocuments)
        .where(isNotNull(assistantDocuments.embedding)),
    );
    expect(embedded.map((row) => row.id)).toContain(id);
  });
});
