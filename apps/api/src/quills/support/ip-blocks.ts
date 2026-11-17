import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import {
  apiRouter,
  nullableResponseTimestamp,
  z,
  type BaseVariables,
} from "../../openapi";
import { kvStore } from "../../database/quills/schema/kv";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import { addressHash, blockKey, liveKey as live } from "../framework/ip-block";
import {
  conversationParams,
  findConversation,
  type ConversationId,
} from "./conversation-model";

// IP blocks (gap G-28). A new conversation remembers a keyed hash of the sender's address for 90
// days; a teammate can block that hash for 30 days from the conversation, for example an anonymous
// visitor with no profile to block. Customer writes from a blocked address answer 403. Neither the
// API nor the team ever sees the address itself.

const REMEMBER_DAYS = 90;
const BLOCK_DAYS = 30;
const senderKey = (id: ConversationId) => `conversation_ip:${id}`;

/** Stores the sender's address hash on a new conversation, when the request has an address. */
export async function rememberSender(
  db: Database,
  conversationId: ConversationId,
  ip: string | null,
) {
  if (!ip) return;
  await db
    .insert(kvStore)
    .values({
      workspaceKey: "_",
      key: senderKey(conversationId),
      value: { hash: addressHash(ip) },
      expiresAt: sql`now() + make_interval(days => ${REMEMBER_DAYS})`,
    })
    .onConflictDoNothing();
}

async function senderHash(db: Database, id: ConversationId) {
  await findConversation(db, id);
  const [row] = await db
    .select({ value: kvStore.value })
    .from(kvStore)
    .where(live(senderKey(id)));
  return (row?.value as { hash?: string } | undefined)?.hash ?? null;
}
async function blockedUntil(db: Database, hash: string | null) {
  if (!hash) return null;
  const [row] = await db
    .select({ expiresAt: kvStore.expiresAt })
    .from(kvStore)
    .where(live(blockKey(hash)));
  return row?.expiresAt ?? null;
}

const state = z.object({
  available: z.boolean().openapi({
    description:
      "Whether an address was recorded for this conversation (kept 90 days)",
  }),
  blockedUntil: nullableResponseTimestamp,
});
const common = {
  params: conversationParams,
  response: state,
  responseDescription: "The IP block of the conversation's sender",
  errors: {
    404: "Conversation not found",
    409: "No address was recorded for this conversation",
  },
} as const;

const getBlock = defineQuillsRoute({
  ...common,
  method: "get",
  path: "/conversations/{conversationId}/ip-block",
  operationId: "getQuillsConversationIpBlock",
  summary: "Get whether the conversation sender's IP address is blocked",
  action: "read",
  handler: async ({ db, params }) => {
    const hash = await senderHash(db, params.conversationId);
    return {
      available: hash !== null,
      blockedUntil: await blockedUntil(db, hash),
    };
  },
});

const block = defineQuillsRoute({
  ...common,
  method: "put",
  path: "/conversations/{conversationId}/ip-block",
  operationId: "blockQuillsConversationIp",
  summary: "Block the conversation sender's IP address for 30 days",
  description:
    "Customer writes (posts, votes, comments, messages, sessions) from that address answer 403 until the block ends. Blocking again starts a new 30 days.",
  action: "update",
  event: ({ params }) => ({
    type: "conversation.ip_blocked",
    entityType: "conversation",
    entityId: params.conversationId,
  }),
  handler: async ({ db, actor, params }) => {
    const hash = await senderHash(db, params.conversationId);
    if (!hash)
      throw new HTTPException(409, {
        message: "No address was recorded for this conversation",
      });
    const expires = sql`now() + make_interval(days => ${BLOCK_DAYS})`;
    await db
      .insert(kvStore)
      .values({
        workspaceKey: "_",
        key: blockKey(hash),
        value: { conversationId: params.conversationId, by: actor.principalId },
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [kvStore.workspaceId, kvStore.workspaceKey, kvStore.key],
        set: { expiresAt: expires },
      });
    return { available: true, blockedUntil: await blockedUntil(db, hash) };
  },
});

const unblock = defineQuillsRoute({
  ...common,
  method: "delete",
  path: "/conversations/{conversationId}/ip-block",
  operationId: "unblockQuillsConversationIp",
  summary: "Lift the IP block of the conversation's sender",
  action: "update",
  event: ({ params }) => ({
    type: "conversation.ip_unblocked",
    entityType: "conversation",
    entityId: params.conversationId,
  }),
  handler: async ({ db, params }) => {
    const hash = await senderHash(db, params.conversationId);
    if (hash)
      await db
        .delete(kvStore)
        .where(
          and(eq(kvStore.workspaceKey, "_"), eq(kvStore.key, blockKey(hash))),
        );
    return { available: hash !== null, blockedUntil: null };
  },
});

/** Teammate routes for IP blocks. */
export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...getBlock)
  .openapi(...block)
  .openapi(...unblock);
