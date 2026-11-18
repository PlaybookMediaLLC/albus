import { beforeAll } from "vite-plus/test";
import { board, post } from "./feedback";
import { evalSuite } from "./suite";

// Post sentiment (engine/content.ts) through the request and read routes.

const CASES = [
  ["I love the new roadmap view, it saves me an hour every week!", "positive"],
  ["Thank you for adding dark mode, it looks great.", "positive"],
  ["The Slack integration works perfectly now, nice job.", "positive"],
  ["Add an option to sort posts by creation date.", "neutral"],
  ["Please support exporting the changelog as RSS.", "neutral"],
  ["Could the widget remember the last selected board?", "neutral"],
  ["The app crashes every time I upload a file. This is unusable.", "negative"],
  ["I was charged twice this month and nobody answers my emails.", "negative"],
  ["Search is so slow that my team stopped using it.", "negative"],
] as const;

evalSuite("sentiment", 0.85, (kit) => {
  let boardId = "";
  beforeAll(async () => {
    boardId = await board(kit, "Eval sentiment");
  });
  for (const [text, expected] of CASES)
    kit.case(`${expected}: ${text}`, async () => {
      const id = await post(kit, boardId, text);
      await kit.settle();
      await kit.api(kit.h.owner, `/posts/${id}/sentiment`, "POST");
      const failed = await kit.settle();
      const read = await kit.api(kit.h.owner, `/posts/${id}/sentiment`);
      return {
        checks: {
          "job succeeded": failed === 0,
          "classifies the sentiment": read.body?.sentiment === expected,
        },
        detail: `${read.body?.sentiment} (${read.body?.confidence})`,
      };
    });
});
