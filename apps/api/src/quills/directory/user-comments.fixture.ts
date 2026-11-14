import { boards } from "../../database/quills/schema/boards";
import { postComments, posts } from "../../database/quills/schema/posts";
import { fixture, type ContractEnv } from "../framework/contract";
import { customers } from "./seed.fixture";

/** A customer in each workspace, and in A a post and a comment by that customer. */
async function commenter(env: ContractEnv) {
  const ids = await customers(env);
  await env.scoped(env.a, async (db) => {
    const [board] = await db
      .insert(boards)
      .values({ name: "Contract", slug: env.id("board") })
      .returning({ id: boards.id });
    const [post] = await db
      .insert(posts)
      .values({
        title: "Contract",
        content: "Contract",
        boardId: board!.id,
        principalId: ids.a as never,
      })
      .returning({ id: posts.id });
    await db.insert(postComments).values({
      postId: post!.id,
      principalId: ids.a as never,
      content: "Contract comment",
    });
  });
  return ids;
}

export const listQuillsUserComments = fixture({
  seed: commenter,
  valid: (ids) => ({ params: { principalId: ids.a } }),
  foreign: (ids) => ({ principalId: ids.b }),
});
