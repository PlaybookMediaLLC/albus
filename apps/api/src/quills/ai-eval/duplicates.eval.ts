import { inArray } from "drizzle-orm";
import { beforeAll } from "vite-plus/test";
import { posts } from "../../database/quills/schema/posts";
import { board, labelled, post } from "./feedback";
import { evalSuite } from "./suite";

// The duplicate check (engine/content.ts) on post.created: the embedding gate, then the model's
// verdict. Each pair is two new posts on one board; a pending suggestion between them is a "yes".
// The pair's posts are deleted afterwards, so later pairs see only their own posts.

type Pair = { first: string; second: string; duplicate: boolean };
type Suggestion = {
  source: { id: string };
  target: { id: string };
  hybridScore: number;
};

evalSuite("duplicates", 0.8, (kit) => {
  let boardId = "";
  beforeAll(async () => {
    boardId = await board(kit, "Eval ideas");
  });

  labelled<Pair>("duplicates.jsonl").forEach((pair, index) =>
    kit.case(
      `pair ${index + 1} (${pair.duplicate ? "same" : "different"}): ${pair.first} / ${pair.second}`,
      async () => {
        const first = await post(kit, boardId, pair.first);
        const firstFailed = await kit.settle();
        const second = await post(kit, boardId, pair.second);
        const secondFailed = await kit.settle();
        const listed = await kit.api(
          kit.h.owner,
          "/merge-suggestions?status=pending&limit=100",
        );
        const found = (listed.body.items as Suggestion[]).find(
          (item) =>
            [item.source.id, item.target.id].sort().join() ===
            [first, second].sort().join(),
        );
        await kit.h.system(kit.h.a, (db) =>
          db
            .update(posts)
            .set({ deletedAt: new Date() })
            .where(inArray(posts.id, [first, second] as never)),
        );
        return {
          checks: {
            "jobs succeeded": firstFailed + secondFailed === 0,
            [pair.duplicate
              ? "flags the duplicate"
              : "leaves different posts alone"]:
              Boolean(found) === pair.duplicate,
          },
          detail: found
            ? `flagged, score ${found.hybridScore.toFixed(2)}`
            : "not flagged",
        };
      },
    ),
  );
});
