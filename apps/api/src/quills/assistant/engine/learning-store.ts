import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  not,
  notExists,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import {
  LearningError,
  PAIR_SIDE_CHARS,
  type ExampleStore,
  type ParsedExampleQuery,
  type Visibility,
} from "@quills/ai/learning";
import type { Database } from "../../../database/quills/client";
import { boards, postTags } from "../../../database/quills/schema/boards";
import { mergeSuggestions } from "../../../database/quills/schema/merge-suggestions";
import { boardProjects } from "../../../database/quills/schema/platform-links";
import {
  postTagAssignments,
  posts,
} from "../../../database/quills/schema/posts";
import { EMBEDDING_DIMENSIONS } from "../provider";
import { exactDistance, storedPostVector, vectorParam } from "./distance";

// Worker helper: teammate decisions as @quills/ai examples. It runs only on the job's
// withQuillsSystemWorkspace connection, so RLS applies, and each query also filters on the
// workspace. Examples come only from visible boards: the subject's (or the requested) board and
// boards without project links. That matters because the duplicate check stores the model's
// reasoning, which teammates read: an example from a third, project-linked board must not reach it.
// Joins name both key columns, (workspace_id, id): with the id alone the planner cannot use the
// primary key, and the lookup of each pair's posts was about six times slower on 5,000 posts.

/** Each subject's vector: a fresh one as a parameter, or the stored one kept in SQL. */
const subjectVectors = (query: ParsedExampleQuery) =>
  query.subjects.map((subject) =>
    subject.embedding
      ? vectorParam(subject.embedding)
      : storedPostVector(subject.key),
  );
/** Similarity to the closest subject, over every given vector column. */
const closest = (columns: AnyPgColumn[], vectors: SQL[]) =>
  sql<number>`greatest(${sql.join(
    columns.flatMap((column) =>
      vectors.map((vector) => sql`1 - ${exactDistance(column, vector)}`),
    ),
    sql`, `,
  )})::float8`;

const pairSide = (title: string, content: string) =>
  `${title}\n${content}`.replace(/\s+/g, " ").trim().slice(0, PAIR_SIDE_CHARS);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function createLearningStore(
  db: Database,
  workspaceId: string,
): ExampleStore {
  const visible = (boardId: AnyPgColumn, visibility: Visibility): SQL =>
    or(
      visibility.boardIds.length
        ? inArray(boardId, visibility.boardIds)
        : undefined,
      visibility.includeUnlinkedBoards
        ? notExists(
            db
              .select({ one: sql`1` })
              .from(boardProjects)
              .where(eq(boardProjects.boardId, boardId)),
          )
        : undefined,
    ) ?? sql`false`;

  /**
   * Durable teammate decisions: an accepted suggestion while its posts are still merged (either
   * way: the accept route can swap the direction), or a dismissed one whose posts were never merged
   * since (a later manual merge contradicts the dismissal).
   */
  async function duplicates(query: ParsedExampleQuery, exclude: string[]) {
    const source = alias(posts, "source_post");
    const target = alias(posts, "target_post");
    const sourceBoard = alias(boards, "source_board");
    const targetBoard = alias(boards, "target_board");
    // IS NOT DISTINCT FROM is false, not NULL, for an unmerged post, so NOT(merged) holds for it.
    const merged = sql`(${source.canonicalPostId} IS NOT DISTINCT FROM ${target.id} OR ${target.canonicalPostId} IS NOT DISTINCT FROM ${source.id})`;
    const rows = await db
      .select({
        id: mergeSuggestions.id,
        status: mergeSuggestions.status,
        resolvedAt: mergeSuggestions.resolvedAt,
        sourceTitle: sql<string>`left(${source.title}, ${PAIR_SIDE_CHARS})`,
        sourceContent: sql<string>`left(${source.content}, ${PAIR_SIDE_CHARS})`,
        targetTitle: sql<string>`left(${target.title}, ${PAIR_SIDE_CHARS})`,
        targetContent: sql<string>`left(${target.content}, ${PAIR_SIDE_CHARS})`,
        similarity: closest(
          [source.embedding, target.embedding],
          subjectVectors(query),
        ).as("similarity"),
      })
      .from(mergeSuggestions)
      .innerJoin(
        source,
        and(
          eq(source.workspaceId, mergeSuggestions.workspaceId),
          eq(source.id, mergeSuggestions.sourcePostId),
        ),
      )
      .innerJoin(
        target,
        and(
          eq(target.workspaceId, mergeSuggestions.workspaceId),
          eq(target.id, mergeSuggestions.targetPostId),
        ),
      )
      .innerJoin(
        sourceBoard,
        and(
          eq(sourceBoard.workspaceId, source.workspaceId),
          eq(sourceBoard.id, source.boardId),
        ),
      )
      .innerJoin(
        targetBoard,
        and(
          eq(targetBoard.workspaceId, target.workspaceId),
          eq(targetBoard.id, target.boardId),
        ),
      )
      .where(
        and(
          eq(mergeSuggestions.workspaceId, workspaceId),
          isNotNull(mergeSuggestions.resolvedByPrincipalId),
          or(
            and(eq(mergeSuggestions.status, "accepted"), merged),
            and(eq(mergeSuggestions.status, "dismissed"), not(merged)),
          ),
          isNull(source.deletedAt),
          isNull(target.deletedAt),
          isNull(sourceBoard.deletedAt),
          isNull(targetBoard.deletedAt),
          isNotNull(source.embedding),
          isNotNull(target.embedding),
          eq(source.embeddingModel, query.embeddingModel),
          eq(target.embeddingModel, query.embeddingModel),
          notInArray(source.id, exclude as never[]),
          notInArray(target.id, exclude as never[]),
          visible(sourceBoard.id, query.visibility),
          visible(targetBoard.id, query.visibility),
        ),
      )
      // By the alias: repeating the expression would compute every distance twice.
      .orderBy(sql`similarity DESC`)
      .limit(query.limit);
    return rows.map((row) => ({
      task: "duplicate" as const,
      key: row.id,
      input: `first: ${pairSide(row.sourceTitle, row.sourceContent)}\nsecond: ${pairSide(row.targetTitle, row.targetContent)}`,
      output: { duplicate: row.status === "accepted" },
      similarity: clamp(row.similarity),
      decidedAt: row.resolvedAt ?? new Date(0),
    }));
  }

  /** Live posts with tags that a teammate chose; only those tags are shown. */
  async function tags(query: ParsedExampleQuery, exclude: string[]) {
    const rows = await db
      .select({
        id: posts.id,
        title: sql<string>`left(${posts.title}, 500)`,
        content: sql<string>`left(${posts.content}, 500)`,
        updatedAt: posts.updatedAt,
        similarity: closest([posts.embedding], subjectVectors(query)).as(
          "similarity",
        ),
        tagNames: sql<
          string[]
        >`array_agg(${postTags.name} ORDER BY ${postTags.name})`,
      })
      .from(posts)
      .innerJoin(
        postTagAssignments,
        and(
          eq(postTagAssignments.workspaceId, posts.workspaceId),
          eq(postTagAssignments.postId, posts.id),
          eq(postTagAssignments.autoTagged, false),
        ),
      )
      .innerJoin(
        postTags,
        and(
          eq(postTags.workspaceId, postTagAssignments.workspaceId),
          eq(postTags.id, postTagAssignments.tagId),
          isNull(postTags.deletedAt),
        ),
      )
      .innerJoin(
        boards,
        and(
          eq(boards.workspaceId, posts.workspaceId),
          eq(boards.id, posts.boardId),
          isNull(boards.deletedAt),
        ),
      )
      .where(
        and(
          eq(posts.workspaceId, workspaceId),
          isNull(posts.deletedAt),
          isNull(posts.canonicalPostId),
          isNotNull(posts.embedding),
          eq(posts.embeddingModel, query.embeddingModel),
          notInArray(posts.id, exclude as never[]),
          visible(boards.id, query.visibility),
        ),
      )
      // The primary key is (workspace_id, id): group by both so the post's columns may be selected.
      .groupBy(posts.workspaceId, posts.id)
      .orderBy(sql`similarity DESC`)
      .limit(query.limit);
    return rows.map((row) => ({
      task: "tags" as const,
      key: row.id,
      input: `${row.title}\n${row.content}`.trim(),
      output: { tags: row.tagNames.slice(0, 10) },
      similarity: clamp(row.similarity),
      // ponytail: an assignment row has no timestamp, so the post's update time stands in for the
      // decision time; a stored example table (phase 2 of issue #275) records the real one.
      decidedAt: row.updatedAt,
    }));
  }

  return {
    dimensions: EMBEDDING_DIMENSIONS,
    async findExamples(query) {
      if (query.scopeId !== workspaceId)
        throw new LearningError("scope_mismatch");
      const exclude = [
        ...new Set([
          ...query.excludeKeys,
          ...query.subjects.map((subject) => subject.key),
        ]),
      ];
      return query.task === "duplicate"
        ? duplicates(query, exclude)
        : tags(query, exclude);
    },
  };
}
