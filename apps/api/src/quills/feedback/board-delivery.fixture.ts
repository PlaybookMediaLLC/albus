import { boards } from "../../database/quills/schema/boards";
import { eq, sql } from "drizzle-orm";
import { fixture, type ContractEnv } from "../framework/contract";
import { seed as tasksSeed, type Ids } from "./post-tasks.fixture";
import { softDeleteBoard } from "./seed.fixture";

/** The task seed, with A's board already delivering to A's project. */
async function seedWithDelivery(env: ContractEnv) {
  const ids = await tasksSeed(env);
  await env.scoped(env.a, (db) =>
    db
      .update(boards)
      .set({
        settings: sql`${boards.settings} || ${JSON.stringify({
          delivery: {
            projectId: ids.a.projectId,
            columnId: null,
            priority: "medium",
            triggerStatusId: null,
          },
        })}::jsonb`,
      })
      .where(eq(boards.id, ids.a.boardId)),
  );
  return ids;
}

export const setQuillsBoardDelivery = fixture({
  seed: tasksSeed,
  valid: ({ a }: Ids) => ({
    params: { boardId: a.boardId },
    body: {
      projectId: a.projectId,
      columnId: a.columnId,
      priority: "high",
      triggerStatusId: a.otherStatusId,
    },
  }),
  foreign: ({ b }: Ids) => ({
    boardId: b.boardId,
    projectId: b.projectId,
    columnId: b.columnId,
    triggerStatusId: b.otherStatusId,
  }),
  softDelete: softDeleteBoard,
});

export const clearQuillsBoardDelivery = fixture({
  seed: seedWithDelivery,
  valid: ({ a }: Ids) => ({ params: { boardId: a.boardId } }),
  foreign: ({ b }: Ids) => ({ boardId: b.boardId }),
  softDelete: softDeleteBoard,
});
