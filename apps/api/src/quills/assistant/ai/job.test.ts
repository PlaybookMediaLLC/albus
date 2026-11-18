import { defineCapability } from "@quills/ai/capability";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { aiUsageLog } from "../../../database/quills/schema/ai-usage-log";
import * as kaneo from "../../../database/schema";
import type { DeliveryEvent } from "../../jobs/fanout";
import { harness } from "../../jobs/handlers/harness.fixture";
import { chatReply, provider } from "../provider-edge.fixture";
import { defineAiJob } from "./job";

// The store template (job.ts) on real PostgreSQL with the local provider: usage rows, their cost,
// and what a provider failure stores with and without a fallback.

let pool: Pool;
vi.mock("../../../database/index", () => ({
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
vi.mock("../../../ws", () => ({
  broadcastToUserAndWait: vi.fn(async () => {}),
}));

const url = process.env.QUILLS_TEST_DATABASE_URL;
const h = harness("aijob");
const event = {
  eventId: "event_test",
  type: "test.happened",
  entityType: "test",
  entityId: "entity_test",
  actorId: null,
  actorType: "system",
  payload: {},
  context: {},
  occurredAt: new Date(),
} as unknown as DeliveryEvent;
const ask = defineCapability({
  id: "test.ask",
  role: "fast",
  step: "job_template_test",
  schema: z.object({ answer: z.string() }),
  prompt: (question: string, wrap) => ({
    system: 'Answer with one JSON object: {"answer": string}.',
    user: wrap("question", question),
  }),
});
/** The first call answers; the second fails at the provider. */
const firstThenFail = () => {
  let calls = 0;
  provider.reply(() =>
    calls++ === 0 ? chatReply({ answer: "one" }) : { status: 503, json: {} },
  );
};
const rows = () =>
  h.system(h.a, (db) =>
    db
      .select({ cost: aiUsageLog.costUsd, status: aiUsageLog.status })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.pipelineStep, "job_template_test")),
  );

describe.skipIf(!url)("defineAiJob", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 4 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    vi.stubEnv("QUILLS_AI_PRICES", "");
    await h.stop();
    await pool?.end();
  });
  beforeEach(async () => {
    vi.stubEnv(
      "QUILLS_AI_PRICES",
      JSON.stringify({ "contract-model": { input: 1, output: 2 } }),
    );
    await h.system(h.a, (db) =>
      db
        .delete(aiUsageLog)
        .where(eq(aiUsageLog.pipelineStep, "job_template_test")),
    );
  });

  it("writes the result and each call's usage row with its cost", async () => {
    provider.reply(() => chatReply({ answer: "one" }));
    let stored = "";
    const work = defineAiJob({
      read: async () => ({ id: "entity_test" }),
      run: (_context, ai) => ai.capability(ask, "first"),
      write: async (_db, _context, result) => {
        stored = result.answer;
      },
    });
    const write = await work(h.a, event);
    await h.system(h.a, write);
    expect(stored).toBe("one");
    // 12 input and 8 output tokens at 1 and 2 dollars per million.
    expect(await rows()).toEqual([{ cost: "0.000028", status: "success" }]);
  });

  it("without a fallback, fails the job but keeps the usage of the call that succeeded", async () => {
    firstThenFail();
    const work = defineAiJob({
      read: async () => ({ id: "entity_test" }),
      run: async (_context, ai) => {
        await ai.capability(ask, "first");
        return ai.capability(ask, "second");
      },
      write: async () => {
        throw new Error("must not write");
      },
    });
    await expect(work(h.a, event)).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(await rows()).toEqual([{ cost: "0.000028", status: "success" }]);
  });

  it("with a fallback, stores the fallback and the usage together", async () => {
    firstThenFail();
    let fellBack = false;
    const work = defineAiJob({
      read: async () => ({ id: "entity_test" }),
      run: async (_context, ai) => {
        await ai.capability(ask, "first");
        return ai.capability(ask, "second");
      },
      write: async () => {
        throw new Error("must not write");
      },
      fallback: async () => {
        fellBack = true;
      },
    });
    await h.system(h.a, await work(h.a, event));
    expect(fellBack).toBe(true);
    expect(await rows()).toHaveLength(1);
  });

  it("stops before a model call once the time budget is spent", async () => {
    provider.reply(() => chatReply({ answer: "one" }));
    const work = defineAiJob({
      budgetMs: -1,
      read: async () => ({ id: "entity_test" }),
      run: (_context, ai) => ai.capability(ask, "first"),
      write: async () => undefined,
    });
    await expect(work(h.a, event)).rejects.toMatchObject({ code: "timeout" });
    expect(await rows()).toEqual([]);
  });
});
