import { sql } from "drizzle-orm";
import { kvStore } from "../../database/quills/schema/kv";
import { fixture, type ContractEnv } from "../framework/contract";
import { addressHash } from "../framework/ip-block";
import { seed, type Ids } from "./conversation-seed.fixture";

/** A's conversation with a remembered sender address, as a new widget conversation stores it. */
const remembered = async (env: ContractEnv, caller: string) => {
  const ids = await seed(env, caller);
  await env.scoped(env.a, (db) =>
    db
      .insert(kvStore)
      .values({
        workspaceKey: "_",
        key: `conversation_ip:${ids.a.conversationId}`,
        value: { hash: addressHash("203.0.113.50") },
        expiresAt: sql`now() + interval '1 day'`,
      })
      .onConflictDoNothing(),
  );
  return ids;
};
const onConversation = fixture({
  seed: remembered,
  valid: (ids: Ids) => ({ params: { conversationId: ids.a.conversationId } }),
  foreign: (ids: Ids) => ({ conversationId: ids.b.conversationId }),
});

export const getQuillsConversationIpBlock = onConversation;
export const blockQuillsConversationIp = onConversation;
export const unblockQuillsConversationIp = onConversation;
