import { createId } from "@kaneo/ids";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as kaneo from "../../../database/schema";
import { assistantToolCalls } from "../../../database/quills/schema/assistant-tool-calls";
import {
  conversationMessages,
  conversations,
} from "../../../database/quills/schema/conversation";
import { events } from "../../../database/quills/schema/events";
import { harness } from "../../jobs/handlers/harness.fixture";
import {
  conversation,
  customer,
} from "../../support/conversation-seed.fixture";
import { addConversationTag } from "../tools/add-conversation-tag";
import { addPrivateNote } from "../tools/add-private-note";
import { setConversationPriority } from "../tools/set-conversation-priority";
import { applyAutoWrites } from "./tool-writes";

// The `auto` approval policy (ai/tool.ts): a write runs as the asking teammate in the job's own
// transaction, after a fresh permission check, with its event and its tool-call record.

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
const h = harness("autowrite");
const autoPriority = { ...setConversationPriority, approval: "auto" as const };

const seed = () =>
  h.as(h.a, h.owner, async (db, actor) => {
    const visitor = await customer(db, `${crypto.randomUUID()}@example.test`);
    const { conversationId } = await conversation(
      db,
      actor.principalId,
      visitor,
    );
    return {
      conversationId: conversationId as string,
      actor: actor.principalId as string,
      visitor,
    };
  });
const state = (conversationId: string) =>
  h.system(h.a, async (db) => ({
    priority: (
      await db
        .select({ priority: conversations.priority })
        .from(conversations)
        .where(eq(conversations.id, conversationId as never))
    )[0]!.priority,
    calls: await db
      .select({
        status: assistantToolCalls.status,
        summary: assistantToolCalls.resultSummary,
      })
      .from(assistantToolCalls)
      .where(eq(assistantToolCalls.conversationId, conversationId as never)),
    changes: await db
      .select({ id: events.eventId })
      .from(events)
      .where(
        and(
          eq(events.type, "conversation.priority_changed"),
          eq(events.entityId, conversationId),
        ),
      ),
  }));

describe.skipIf(!url)("auto write tools", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 4 });
    await h.start(pool, url!);
  }, 120000);
  afterAll(async () => {
    await h.stop();
    await pool?.end();
  });

  it("runs as the asking teammate, records the event and the call, and commits with the job", async () => {
    const { conversationId, actor } = await seed();
    await h.system(h.a, (db) =>
      applyAutoWrites(db, {
        workspaceId: h.a,
        principalId: actor,
        conversationId,
        writes: [{ tool: autoPriority, args: { priority: "high" } }],
      }),
    );
    expect(await state(conversationId)).toEqual({
      priority: "high",
      calls: [{ status: "succeeded", summary: "Changed" }],
      changes: [{ id: expect.any(String) }],
    });
  });

  it("changes nothing for someone who does not hold the tool's action now", async () => {
    const { conversationId, visitor } = await seed();
    await h.system(h.a, (db) =>
      applyAutoWrites(db, {
        workspaceId: h.a,
        principalId: visitor,
        conversationId,
        writes: [{ tool: autoPriority, args: { priority: "high" } }],
      }),
    );
    expect(await state(conversationId)).toEqual({
      priority: "none",
      calls: [{ status: "denied", summary: "Requires update" }],
      changes: [],
    });
  });

  it("marks a refused write failed and still applies the next one", async () => {
    const { conversationId, actor } = await seed();
    const autoTag = { ...addConversationTag, approval: "auto" as const };
    await h.system(h.a, (db) =>
      applyAutoWrites(db, {
        workspaceId: h.a,
        principalId: actor,
        conversationId,
        writes: [
          // A well-formed tag ID that does not exist: the domain function refuses it.
          { tool: autoTag, args: { tagId: createId("conversation_tag") } },
          { tool: autoPriority, args: { priority: "high" } },
        ],
      }),
    );
    expect(await state(conversationId)).toEqual({
      priority: "high",
      calls: expect.arrayContaining([
        { status: "failed", summary: "Could not apply" },
        { status: "succeeded", summary: "Changed" },
      ]),
      changes: [{ id: expect.any(String) }],
    });
  });

  it("rolls back with the job: a failure after the write leaves no change", async () => {
    const { conversationId, actor } = await seed();
    await expect(
      h.system(h.a, async (db) => {
        await applyAutoWrites(db, {
          workspaceId: h.a,
          principalId: actor,
          conversationId,
          writes: [{ tool: autoPriority, args: { priority: "urgent" } }],
        });
        throw new Error("job failed after the write");
      }),
    ).rejects.toThrow("job failed after the write");
    expect((await state(conversationId)).priority).toBe("none");
  });

  it("adds a private note without approval, seen only by the team", async () => {
    const { conversationId, actor } = await seed();
    expect(addPrivateNote.approval).toBe("auto");
    await h.system(h.a, (db) =>
      applyAutoWrites(db, {
        workspaceId: h.a,
        principalId: actor,
        conversationId,
        writes: [
          { tool: addPrivateNote, args: { content: "Refund approved." } },
        ],
      }),
    );
    const notes = await h.system(h.a, (db) =>
      db
        .select({
          content: conversationMessages.content,
          isInternal: conversationMessages.isInternal,
          principalId: conversationMessages.principalId,
        })
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId as never),
            eq(conversationMessages.content, "Refund approved."),
          ),
        ),
    );
    expect(notes).toEqual([
      { content: "Refund approved.", isInternal: true, principalId: actor },
    ]);
    expect((await state(conversationId)).calls).toEqual([
      { status: "succeeded", summary: "Changed" },
    ]);
  });
});
