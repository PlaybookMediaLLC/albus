import { readFileSync } from "node:fs";
import type { Kit } from "./suite";

/** A board in workspace A, created through the shipped route. */
export async function board(kit: Kit, name: string) {
  const created = await kit.api(kit.h.owner, "/boards", "POST", { name });
  if (created.status !== 200) throw new Error(`Board: ${created.status}`);
  return created.body.id as string;
}

/** A post on the board, created through the shipped route (it records post.created). */
export async function post(
  kit: Kit,
  boardId: string,
  title: string,
  tagIds: string[] = [],
) {
  const created = await kit.api(kit.h.owner, "/posts", "POST", {
    boardId,
    title,
    tagIds,
  });
  if (created.status !== 200) throw new Error(`Post: ${created.status}`);
  return created.body.id as string;
}

/**
 * The labelled items of the offline replay (scripts/ai-learning-eval), written for evaluation:
 * no production data.
 */
export const labelled = <T>(file: string): T[] =>
  readFileSync(
    new URL(`../../../scripts/ai-learning-eval/${file}`, import.meta.url),
    "utf8",
  )
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
