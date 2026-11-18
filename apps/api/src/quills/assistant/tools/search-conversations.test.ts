import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as kaneo from "../../../database/schema";
import { harness } from "../../jobs/handlers/harness.fixture";
import {
  conversation,
  customer,
} from "../../support/conversation-seed.fixture";
import type { ToolContext } from "../ai/tool";
import { searchConversations } from "./search-conversations";

// search_conversations reads only the asking workspace, leaves out the current conversation and
// returns at most 5.

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
const h = harness("searchconv");
const seed = (workspace: string, user: string, subject: string) =>
  h.as(workspace, user, async (db, actor) => {
    const visitor = await customer(db, `${crypto.randomUUID()}@example.test`);
    return (await conversation(db, actor.principalId, visitor, { subject }))
      .conversationId as string;
  });

describe.skipIf(!url)("search_conversations", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 4 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    await h.stop();
    await pool?.end();
  });

  it("reads only the asking workspace, without the current conversation, at most 5", async () => {
    const word = `Invoice${crypto.randomUUID().slice(0, 6)}`;
    const ours: string[] = [];
    for (let i = 0; i < 7; i++) ours.push(await seed(h.a, h.owner, word));
    const foreign = await seed(h.b, h.outsider, word);
    const principalId = await h.principal(h.a, h.owner);
    const context: ToolContext = {
      workspaceId: h.a,
      principalId,
      actions: ["read"],
      // The newest: without the exclusion it would be in the first 5.
      conversationId: ours[6]!,
      ticketId: null,
      knowledge: { helpCenter: false, documents: false },
    };
    const result = await h.system(h.a, (db) =>
      searchConversations.run(db, context, { query: word }),
    );
    const ids = [...result.content.matchAll(/\[conversation:([^\]]+)\]/g)].map(
      (match) => match[1],
    );
    // The 5 newest, without the current one.
    expect(ids).toHaveLength(4);
    expect(ids).not.toContain(ours[6]);
    expect(ids).not.toContain(foreign);
    expect(ids.every((id) => ours.includes(id!))).toBe(true);
  });
});
