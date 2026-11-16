import { postExternalLinks } from "../../database/quills/schema/external-links";
import { fixture, type ContractEnv } from "../framework/contract";
import { onConversation, seeded, type Ids } from "./conversation-seed.fixture";

/** The posts seed, with each workspace's post tracked from its conversation. */
async function trackedSeed(env: ContractEnv, caller: string) {
  const ids = await seeded("posts")(env, caller);
  for (const [workspaceId, side] of [
    [env.a, ids.a],
    [env.b, ids.b],
  ] as const)
    await env.scoped(workspaceId, async (db) => {
      await db.insert(postExternalLinks).values({
        postId: side.postId as never,
        integrationType: "live_chat",
        externalId: side.conversationId,
        origin: "reference",
      });
    });
  return ids;
}

export const createQuillsPostFromConversation = onConversation(
  (ids) => ({
    body: { boardId: ids.a.boardId, title: "Tracked from support" },
  }),
  (ids) => ({ boardId: ids.b.boardId }),
  ["posts"],
);
export const shareQuillsPost = onConversation(
  (ids) => ({ body: { postId: ids.a.postId } }),
  (ids) => ({ postId: ids.b.postId }),
  ["posts"],
);
export const getQuillsLinkedPostsForConversation = onConversation();
export const unlinkQuillsPostFromConversation = fixture({
  seed: trackedSeed,
  valid: (ids: Ids) => ({
    params: { conversationId: ids.a.conversationId, postId: ids.a.postId },
  }),
  foreign: (ids: Ids) => ({
    conversationId: ids.b.conversationId,
    postId: ids.b.postId,
  }),
});
export const getQuillsLinkedConversationsForPost = fixture({
  seed: seeded("posts"),
  valid: (ids: Ids) => ({ params: { postId: ids.a.postId } }),
  foreign: (ids: Ids) => ({ postId: ids.b.postId }),
});
