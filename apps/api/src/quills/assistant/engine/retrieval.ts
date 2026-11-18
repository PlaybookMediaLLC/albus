// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
  type AnyColumn,
} from "drizzle-orm";
import type { Database } from "../../framework/define-route";
import {
  assistantDocuments,
  assistantSnippets,
} from "../../../database/quills/schema/assistant";
import { assistantWebSources } from "../../../database/quills/schema/assistant-web-sources";
import {
  helpCenterArticles,
  helpCenterCategories,
} from "../../../database/quills/schema/kb";
import { exactDistance, vectorParam } from "./distance";

// Knowledge the assistant reads. The audience is the reader's ceiling: a teammate (copilot) sees
// published articles and public or team snippets; a widget visitor sees only published articles
// in public categories with no segment gate on the article or its category, and public snippets.
// Documents and fetched web pages are customer-answerable by design (the source's rule), so both
// ceilings read them when the knowledge setting allows documents.

export type Audience = "team" | "public";
export type Source = {
  type: "article" | "snippet" | "document" | "webpage";
  id: string;
  title: string;
  excerpt: string;
};
const LIMIT = 5;
const like = (query: string) =>
  `%${query.replace(/[\\%_]/g, "\\$&").slice(0, 200)}%`;
/** Any word of the query (up to eight words of three letters or more) in one of the columns. */
const anyWord = (query: string, ...columns: AnyColumn[]) => {
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 8);
  return or(
    ...(words.length ? words : [query]).flatMap((word) =>
      columns.map((column) => ilike(column, like(word))),
    ),
  );
};

export async function searchArticles(
  db: Database,
  query: string,
  audience: Audience,
): Promise<Source[]> {
  const match = sql`${helpCenterArticles.searchVector} @@ plainto_tsquery('english', ${query})`;
  const rows = await db
    .select({
      id: helpCenterArticles.id,
      title: helpCenterArticles.title,
      content: helpCenterArticles.content,
    })
    .from(helpCenterArticles)
    .innerJoin(
      helpCenterCategories,
      eq(helpCenterCategories.id, helpCenterArticles.categoryId),
    )
    .where(
      and(
        isNull(helpCenterArticles.deletedAt),
        // A future publish time is a scheduled article, not a published one.
        lte(helpCenterArticles.publishedAt, sql`now()`),
        isNull(helpCenterCategories.deletedAt),
        audience === "public"
          ? and(
              eq(helpCenterCategories.isPublic, true),
              sql`${helpCenterArticles.segmentIds} = '[]'::jsonb`,
              sql`${helpCenterCategories.segmentIds} = '[]'::jsonb`,
            )
          : undefined,
        or(match, ilike(helpCenterArticles.title, like(query))),
      ),
    )
    .orderBy(
      desc(
        sql`ts_rank(${helpCenterArticles.searchVector}, plainto_tsquery('english', ${query}))`,
      ),
    )
    .limit(LIMIT);
  return rows.map((row) => ({
    type: "article",
    id: row.id,
    title: row.title,
    excerpt: row.content.slice(0, 1200),
  }));
}

/** The question's vector and the model that made it, for search by meaning. */
export type Near = { values: number[]; model: string };
/**
 * Below this cosine similarity a row is not near enough to the question. ponytail: one floor for
 * every model; the live eval (ai-eval/) measures it, so tune it there.
 */
const NEAR_SIMILARITY = 0.4;
/** Rows whose vector (from the same model) is near the question, nearest first. */
const nearTo = (
  near: Near | null | undefined,
  column: { embedding: unknown; embeddingModel: AnyColumn },
) => {
  if (!near) return null;
  const distance = exactDistance(column.embedding, vectorParam(near.values));
  return {
    match: and(
      eq(column.embeddingModel, near.model),
      sql`${distance} <= ${1 - NEAR_SIMILARITY}`,
    ),
    order: sql`${distance} asc nulls last`,
  };
};

/**
 * What a customer may be told, by the customer agent's knowledge settings: published public
 * articles when `helpCenter` is on, then public snippets, and documents and web pages when
 * `documents` is on.
 */
export const publicSources = async (
  db: Database,
  knowledge: { helpCenter: boolean; documents: boolean },
  query: string,
  near?: Near | null,
): Promise<Source[]> => [
  ...(knowledge.helpCenter ? await searchArticles(db, query, "public") : []),
  ...(await searchKnowledge(db, query, "public", knowledge.documents, near)),
];

/**
 * Snippets within the audience, then documents and ready web pages when `documents` is on. A row
 * matches by its words, or, with `near`, by its meaning (an embedding near the question's).
 */
export async function searchKnowledge(
  db: Database,
  query: string,
  audience: Audience,
  documents: boolean,
  near?: Near | null,
): Promise<Source[]> {
  const snippetNear = nearTo(near, assistantSnippets);
  const snippets = await db
    .select({
      id: assistantSnippets.id,
      title: assistantSnippets.title,
      content: assistantSnippets.content,
    })
    .from(assistantSnippets)
    .where(
      and(
        eq(assistantSnippets.enabled, true),
        inArray(
          assistantSnippets.audience,
          audience === "public" ? ["public"] : ["public", "team"],
        ),
        or(
          anyWord(query, assistantSnippets.title, assistantSnippets.content),
          snippetNear?.match,
        ),
      ),
    )
    .orderBy(
      ...(snippetNear ? [snippetNear.order] : []),
      desc(assistantSnippets.updatedAt),
    )
    .limit(LIMIT);
  const found: Source[] = snippets.map((row) => ({
    type: "snippet",
    id: row.id,
    title: row.title,
    excerpt: row.content,
  }));
  if (!documents) return found;
  const documentNear = nearTo(near, assistantDocuments);
  const files = await db
    .select({
      id: assistantDocuments.id,
      title: assistantDocuments.title,
      excerpt: sql<string>`left(${assistantDocuments.content}, 1200)`,
    })
    .from(assistantDocuments)
    .where(
      and(
        isNull(assistantDocuments.deletedAt),
        or(
          anyWord(query, assistantDocuments.title, assistantDocuments.content),
          documentNear?.match,
        ),
      ),
    )
    .orderBy(
      ...(documentNear ? [documentNear.order] : []),
      desc(assistantDocuments.createdAt),
    )
    .limit(LIMIT);
  const pages = await db
    .select({
      id: assistantWebSources.id,
      title: assistantWebSources.title,
      excerpt: sql<string>`left(${assistantWebSources.content}, 1200)`,
    })
    .from(assistantWebSources)
    .where(
      and(
        eq(assistantWebSources.enabled, true),
        ne(assistantWebSources.content, ""),
        anyWord(query, assistantWebSources.title, assistantWebSources.content),
      ),
    )
    .orderBy(desc(assistantWebSources.fetchedAt))
    .limit(LIMIT);
  return [
    ...found,
    ...files.map((row) => ({ type: "document" as const, ...row })),
    ...pages.map((row) => ({ type: "webpage" as const, ...row })),
  ];
}

export const formatSources = (sources: Source[]) =>
  sources.length
    ? sources
        .map(
          (source) =>
            `[${source.type}:${source.id}] ${source.title}\n${source.excerpt}`,
        )
        .join("\n\n")
    : "No results.";
