import { eq, inArray } from "drizzle-orm";
import { beforeAll } from "vite-plus/test";
import { postTagAssignments } from "../../database/quills/schema/posts";
import { postTags } from "../../database/quills/schema/boards";
import { board, labelled, post } from "./feedback";
import { evalSuite } from "./suite";

// The tag backfill (engine/content.ts) as a team uses it: a teammate tagged the first 20 posts
// by hand, which the backfill reads as examples; the backfill then tags the other 40. A post
// passes when every tag it got is right and it got at least one right tag.

type Tagged = { text: string; tags: string[] };
const items = labelled<Tagged>("tags.jsonl");
const HAND_TAGGED = 20;

evalSuite("tags", 0.75, (kit) => {
  const chosen = new Map<string, string[]>();
  const postIds: string[] = [];
  beforeAll(async () => {
    const boardId = await board(kit, "Eval feedback");
    const tagIds = new Map<string, string>();
    for (const name of [
      ...new Set(items.flatMap((item) => item.tags)),
    ].sort()) {
      const created = await kit.ok(kit.h.owner, "/tags", "POST", { name });
      tagIds.set(name, created.body.id);
    }
    for (const [index, item] of items.entries())
      postIds.push(
        await post(
          kit,
          boardId,
          item.text,
          index < HAND_TAGGED ? item.tags.map((name) => tagIds.get(name)!) : [],
        ),
      );
    await kit.settle();
    for (let run = 0; run < 2; run++) {
      await kit.ok(kit.h.owner, "/posts/ai-tags/backfill", "POST", {
        limit: 30,
        boardId,
      });
      await kit.settle();
    }
    const rows = await kit.h.system(kit.h.a, (db) =>
      db
        .select({ postId: postTagAssignments.postId, name: postTags.name })
        .from(postTagAssignments)
        .innerJoin(postTags, eq(postTags.id, postTagAssignments.tagId))
        .where(
          inArray(
            postTagAssignments.postId,
            postIds.slice(HAND_TAGGED) as never,
          ),
        ),
    );
    for (const row of rows)
      chosen.set(row.postId, [...(chosen.get(row.postId) ?? []), row.name]);
  });

  items.slice(HAND_TAGGED).forEach((item, offset) =>
    kit.case(`post ${HAND_TAGGED + offset + 1}: ${item.text}`, async () => {
      const got = chosen.get(postIds[HAND_TAGGED + offset]!) ?? [];
      return {
        checks: {
          "no wrong tag": got.every((name) => item.tags.includes(name)),
          "at least one right tag": got.some((name) =>
            item.tags.includes(name),
          ),
        },
        detail: `expected ${item.tags.join(", ")}; got ${got.join(", ") || "none"}`,
      };
    }),
  );
});
