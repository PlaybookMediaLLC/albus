import { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import { assistantDocuments } from "../../database/quills/schema/assistant";
import { files } from "../../database/quills/schema/files";
import type { BaseVariables } from "../../openapi";
import router from "..";
import { createUpload } from "../framework/files";
import { harness } from "../jobs/handlers/harness.fixture";
import { samplePdf } from "./pdf.fixture";

// POST /assistant/documents/pdf with the object store mocked as in framework/contract.test.ts:
// the PDF's text becomes a document, and a key that a file row already uses is never deleted.

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
vi.mock("../../storage/s3", async (original) => ({
  ...(await original<typeof import("../../storage/s3")>()),
  verifyTaskAssetUpload: vi.fn(
    async (_key: string, expected: { size: number; contentType: string }) =>
      expected,
  ),
}));
vi.spyOn(S3Client.prototype, "send").mockImplementation((async (
  command: unknown,
) => {
  if (!(command instanceof GetObjectCommand))
    throw new Error("Unexpected storage call");
  return {
    Body: Readable.from([Buffer.from(samplePdf("Returns are free."))]),
  };
}) as never);

const url = process.env.QUILLS_TEST_DATABASE_URL;
const h = harness("docpdf");
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
const pdf = { contentType: "application/pdf", size: 1024 };
const upload = async () =>
  (await createUpload(h.a, { purpose: "file", filename: "a.pdf", ...pdf })).key;
const send = (key: string) =>
  app.request(`/quills/${h.a}/assistant/documents/pdf`, {
    method: "POST",
    headers: { "x-user": h.owner, "content-type": "application/json" },
    body: JSON.stringify({ title: "Returns", fileName: "a.pdf", key, ...pdf }),
  });

describe.skipIf(!url)("PDF documents", () => {
  beforeAll(async () => {
    // Placeholder storage settings, as in framework/contract.test.ts: no request leaves the process.
    vi.stubEnv("S3_ENDPOINT", "http://127.0.0.1:9");
    vi.stubEnv("S3_BUCKET", "quills-pdf-test");
    vi.stubEnv("S3_ACCESS_KEY_ID", "test");
    vi.stubEnv("S3_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("S3_KEY_PREFIX", "");
    pool = new Pool({ connectionString: url, max: 4 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    vi.unstubAllEnvs();
    await h.stop();
    await pool?.end();
  });

  it("stores the PDF's text as a document and keeps no file row", async () => {
    const key = await upload();
    const res = await send(key);
    expect(res.status).toBe(200);
    const { id } = (await res.json()) as { id: string };
    const [document] = await h.system(h.a, (db) =>
      db
        .select({
          content: assistantDocuments.content,
          mimeType: assistantDocuments.mimeType,
        })
        .from(assistantDocuments)
        .where(eq(assistantDocuments.id, id as never)),
    );
    expect(document).toEqual({
      content: "Returns are free.",
      mimeType: "application/pdf",
    });
    expect(
      await h.system(h.a, (db) =>
        db.select().from(files).where(eq(files.storageKey, key)),
      ),
    ).toEqual([]);
  });

  it("refuses a key that a file row already uses, and leaves that file alone", async () => {
    const key = await upload();
    const [attached] = await h.as(h.a, h.owner, (db, actor) =>
      db
        .insert(files)
        .values({
          storageKey: key,
          name: "a.pdf",
          contentType: "application/pdf",
          family: "pdf",
          size: 1024,
          sha256: "0".repeat(64),
          source: "agent",
          uploadedById: actor.principalId,
          attachedAt: new Date(),
        })
        .returning({ id: files.id }),
    );
    expect((await send(key)).status).toBe(409);
    expect(
      await h.system(h.a, (db) =>
        db
          .select({ id: files.id })
          .from(files)
          .where(eq(files.id, attached!.id)),
      ),
    ).toHaveLength(1);
  });
});
