import { columnTable, projectTable, taskTable } from "../../database/schema";
import { postTasks } from "../../database/quills/schema/platform-links";
import { fixture, type ContractEnv } from "../framework/contract";
import { seed as feedbackSeed } from "./seed.fixture";
import { softDeletes } from "./seeds.fixture";

/** A project with an open and a final column, and a task in it, in each workspace. */
async function project(env: ContractEnv, workspaceId: string) {
  const projectId = env.id("project"),
    taskId = env.id("task"),
    columnId = env.id("column");
  await env.db
    .insert(projectTable)
    // Kaneo's counter holds the seeded task's number, as createTask leaves it.
    .values({
      id: projectId,
      workspaceId,
      name: "Contract",
      slug: projectId,
      lastTaskNumber: 1,
    });
  await env.db.insert(columnTable).values([
    { id: columnId, projectId, name: "To do", slug: "to-do", position: 0 },
    {
      id: env.id("column"),
      projectId,
      name: "Done",
      slug: "done",
      position: 1,
      isFinal: true,
    },
  ]);
  await env.db
    .insert(taskTable)
    .values({ id: taskId, projectId, title: "Contract", number: 1 });
  return { projectId, taskId, columnId };
}

export async function seed(env: ContractEnv) {
  const posts = await feedbackSeed(env);
  const a = { ...posts.a, ...(await project(env, env.a)) };
  const b = { ...posts.b, ...(await project(env, env.b)) };
  await env.scoped(env.a, (db) =>
    db.insert(postTasks).values({ postId: a.postId, taskId: a.taskId }),
  );
  return { a, b };
}
export type Ids = Awaited<ReturnType<typeof seed>>;

const softDelete = softDeletes("posts", ({ a }: Ids) => a.postId);

export const createQuillsPostTask = fixture({
  seed,
  valid: ({ a }: Ids) => ({
    params: { postId: a.postId },
    body: { projectId: a.projectId, columnId: a.columnId },
  }),
  foreign: ({ b }: Ids) => ({
    postId: b.postId,
    projectId: b.projectId,
    columnId: b.columnId,
  }),
  softDelete,
});

export const listQuillsPostTasks = fixture({
  seed,
  valid: ({ a }: Ids) => ({ params: { postId: a.postId } }),
  foreign: ({ b }: Ids) => ({ postId: b.postId }),
  softDelete,
});
