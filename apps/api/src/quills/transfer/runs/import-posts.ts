import { createId, type TypeId } from "@kaneo/ids";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../../database/quills/client";
import { principal, user } from "../../../database/quills/schema/auth";
import { boards, postTags } from "../../../database/quills/schema/boards";
import { postExternalLinks } from "../../../database/quills/schema/external-links";
import type {
  ImportRunErrorEntry,
  ImportRunTotals,
} from "../../../database/quills/schema/import-runs";
import {
  posts,
  postTagAssignments,
} from "../../../database/quills/schema/posts";
import { postStatuses } from "../../../database/quills/schema/statuses";
import { boardVisible } from "../../feedback/visibility";
import { parseCsv } from "./csv";

// Post CSV import. Every row is checked against the workspace before anything is written; one
// invalid row fails the whole file. Rows whose source_id an earlier import created are skipped.

const MAX_IMPORT_ROWS = 10_000;
const MAX_ERRORS = 100;
/** post_external_links.integration_type of the posts that an import created. */
const IMPORT_LINK = "import";

export type CsvRecord = { [column: string]: string };
type ImportResult = {
  totals: ImportRunTotals;
  errors: ImportRunErrorEntry[];
};

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);
// A date and time without a zone, as other tools write it, is read as UTC.
const LOCAL_TIME = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?$/;
const rowSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().trim().max(10000).default(""),
  status: optional(200),
  tags: optional(2000),
  board: optional(200),
  author_email: optional(254).pipe(z.email().optional()),
  author_name: optional(200),
  // ISO only, as the posts export writes it: a loose date parser reads "1" as 2001-01-01.
  created_at: optional(40)
    .transform((v) =>
      v?.replace(
        LOCAL_TIME,
        (_, day: string, time: string, seconds?: string) =>
          `${day}T${time}${seconds ?? ":00"}Z`,
      ),
    )
    .pipe(
      z
        .union([z.iso.date(), z.iso.datetime({ offset: true })], {
          error: "Use an ISO date",
        })
        .optional(),
    ),
  source_id: optional(200),
});

// Other feedback tools name the same columns differently (gap G-25): their exports import as they
// are. A header matches here when the file has no column of the canonical name. The tools do not
// publish their export headers, so these are the common names. A vote count is not imported: a
// vote belongs to a person.
const ALIASES: Record<string, string> = {
  post_title: "title",
  idea_title: "title",
  name: "title",
  subject: "title",
  details: "content",
  post_details: "content",
  description: "content",
  body: "content",
  post_status: "status",
  state: "status",
  board_name: "board",
  email: "author_email",
  user_email: "author_email",
  created_by_email: "author_email",
  author: "author_name",
  post_author: "author_name",
  user_name: "author_name",
  created_by: "author_name",
  created: "created_at",
  created_date: "created_at",
  creation_date: "created_at",
  date: "created_at",
  submitted_at: "created_at",
  labels: "tags",
  id: "source_id",
  post_id: "source_id",
  idea_id: "source_id",
  url: "source_id",
  post_url: "source_id",
};

/** Header names as the row schema reads them: lower case, words joined by "_", aliases resolved. */
export function importColumns(header: readonly string[]) {
  const names = header.map((name) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
  );
  const taken = new Set(names);
  return names.map((name) => {
    const canonical = ALIASES[name];
    if (!canonical || taken.has(canonical)) return name;
    taken.add(canonical);
    return canonical;
  });
}

/** The data rows of a CSV file keyed by normalized header, or why the file cannot be read. */
export function readRecords(
  text: string,
): { records: CsvRecord[] } | { error: string } {
  let rows: string[][];
  try {
    rows = parseCsv(text);
  } catch {
    return { error: "The file is not valid CSV" };
  }
  const [header, ...data] = rows;
  const columns = importColumns(header ?? []);
  const missing = ["title"].filter((c) => !columns.includes(c));
  if (missing.length)
    return { error: `Missing required columns: ${missing.join(", ")}` };
  if (!data.length) return { error: "The file has no rows" };
  if (data.length > MAX_IMPORT_ROWS)
    return { error: "The file has more than 10,000 rows" };
  return {
    records: data.map((row) =>
      Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""])),
    ),
  };
}

const STATUS_WORDS: [RegExp, string][] = [
  [/^(new|pending|needs[ _]review|awaiting[ _]review)$/, "open"],
  [/^(reviewing|considering|under[ _]consideration)$/, "under_review"],
  [/^(next|later|up[ _]next|roadmap|on[ _]the[ _]roadmap)$/, "planned"],
  [
    /^(in[ _]development|building|started|doing|working[ _]on[ _]it)$/,
    "in_progress",
  ],
  [/^(completed|done|shipped|released|live|launched|fixed)$/, "complete"],
  [
    /^(declined|rejected|won'?t[ _](do|fix)|not[ _]planned|archived)$/,
    "closed",
  ],
];

const clip = (value: string) =>
  value.length > 80 ? `${value.slice(0, 80)}…` : value;

/**
 * Checks every record, then writes all posts, their tags, source links and new customers, or
 * nothing. Call in the transaction that also settles the run.
 */
export async function importPosts(
  db: Database,
  input: {
    records: CsvRecord[];
    boardId: TypeId<"board">;
    projects: string[];
    /** The teammate who started the run: the author of rows without author_email. */
    initiator: TypeId<"principal">;
    /** Lowercase addresses of this workspace's teammates; no imported row may claim one. */
    teammateEmails: ReadonlySet<string>;
  },
): Promise<ImportResult> {
  const errors: ImportRunErrorEntry[] = [];
  let errorCount = 0;
  const fail = (row: number, message: string, field?: string) => {
    errorCount++;
    if (errors.length < MAX_ERRORS) errors.push({ row, message, field });
  };
  const totals = (created: number, skipped: number): ImportResult => ({
    totals: {
      rows: input.records.length,
      created,
      updated: 0,
      skipped,
      errors: errorCount,
    },
    errors,
  });

  const visibleBoards = await db
    .select({ id: boards.id, slug: boards.slug })
    .from(boards)
    .where(boardVisible(input.projects));
  if (!visibleBoards.some((b) => b.id === input.boardId)) {
    fail(0, "The target board is not available", "boardId");
    return totals(0, 0);
  }
  const boardBySlug = new Map(
    visibleBoards.map((b) => [b.slug.toLowerCase(), b.id]),
  );
  const statuses = await db
    .select({
      id: postStatuses.id,
      slug: postStatuses.slug,
      name: postStatuses.name,
      isDefault: postStatuses.isDefault,
    })
    .from(postStatuses)
    .where(isNull(postStatuses.deletedAt));
  const statusByKey = new Map(
    statuses.flatMap((s) => [
      [s.slug.toLowerCase(), s.id],
      [s.name.toLowerCase(), s.id],
    ]),
  );
  const defaultStatus = statuses.find((s) => s.isDefault)?.id ?? null;
  // Another tool's status word, as the default status of the same meaning.
  const statusOf = (name: string) => {
    const key = name.toLowerCase();
    const word = STATUS_WORDS.find(([pattern]) => pattern.test(key))?.[1];
    return statusByKey.get(key) ?? (word ? statusByKey.get(word) : undefined);
  };
  const tags = await db
    .select({ id: postTags.id, name: postTags.name })
    .from(postTags)
    .where(isNull(postTags.deletedAt));
  const tagByName = new Map(tags.map((t) => [t.name.toLowerCase(), t.id]));

  const now = Date.now();
  const sourceIds = new Set<string>();
  const rows = input.records.flatMap((record, index) => {
    const line = index + 1;
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        fail(line, issue.message, String(issue.path[0]));
      return [];
    }
    const row = parsed.data;
    const boardId = row.board
      ? boardBySlug.get(row.board.toLowerCase())
      : input.boardId;
    if (!boardId) fail(line, `Unknown board: ${clip(row.board!)}`, "board");
    const statusId = row.status ? statusOf(row.status) : defaultStatus;
    if (statusId === undefined)
      fail(line, `Unknown status: ${clip(row.status!)}`, "status");
    const tagNames = (row.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tagIds = tagNames.map((name) => tagByName.get(name.toLowerCase()));
    tagNames.forEach((name, i) => {
      if (!tagIds[i]) fail(line, `Unknown tag: ${clip(name)}`, "tags");
    });
    const createdAt = row.created_at ? new Date(row.created_at) : undefined;
    if (createdAt && createdAt.getTime() > now + 86_400_000)
      fail(line, "created_at is in the future", "created_at");
    if (row.source_id) {
      if (sourceIds.has(row.source_id))
        fail(line, "Duplicate source_id in this file", "source_id");
      sourceIds.add(row.source_id);
    }
    return [
      {
        line,
        ...row,
        boardId: boardId!,
        statusId: statusId ?? null,
        tagIds: [...new Set(tagIds)] as TypeId<"post_tag">[],
        createdAt,
      },
    ];
  });
  if (errorCount) return totals(0, 0);

  const imported = sourceIds.size
    ? new Set(
        (
          await db
            .select({ id: postExternalLinks.externalId })
            .from(postExternalLinks)
            .where(
              and(
                eq(postExternalLinks.integrationType, IMPORT_LINK),
                sql`${postExternalLinks.externalId} = any(${sql.param([...sourceIds])}::text[])`,
              ),
            )
        ).map((r) => r.id),
      )
    : new Set<string>();
  const fresh = rows.filter((r) => !r.source_id || !imported.has(r.source_id));

  // Authors: an existing customer by email, a new customer for an unknown email, else the initiator.
  const names = new Map<string, string>();
  for (const row of fresh) {
    const email = row.author_email?.toLowerCase();
    if (email && !names.has(email))
      names.set(email, row.author_name ?? email.split("@")[0]!);
  }
  const emails = [...names.keys()];
  const known = emails.length
    ? await db
        .select({
          email: sql<string>`lower(${user.email})`,
          userId: user.id,
          principalId: principal.id,
          // Not a customer by the directory's rule (directory/customer.ts): a test customer, or the
          // profile of an account that is a teammate here.
          refused: sql<boolean>`(${principal.testOwnerPrincipalId} is not null or exists (select 1 from ${principal} m where m.kaneo_user_id = ${user.kaneoUserId}))`,
        })
        .from(user)
        .leftJoin(principal, eq(principal.userId, user.id))
        .where(sql`lower(${user.email}) = any(${sql.param(emails)}::text[])`)
    : [];
  const refused = new Set(known.filter((k) => k.refused).map((k) => k.email));
  for (const row of fresh) {
    const email = row.author_email?.toLowerCase();
    if (email && (input.teammateEmails.has(email) || refused.has(email)))
      fail(
        row.line,
        "author_email belongs to a teammate or a test customer",
        "author_email",
      );
  }
  if (errorCount) return totals(0, 0);

  // New customers in batches: a profile for each unknown email, a principal for each profile without one.
  const userIds = new Map(known.map((k) => [k.email, k.userId]));
  const authors = new Map(
    known.flatMap((k) => (k.principalId ? [[k.email, k.principalId]] : [])),
  ) as Map<string, TypeId<"principal">>;
  const newUsers = emails.filter((email) => !userIds.has(email));
  for (let i = 0; i < newUsers.length; i += 1000) {
    const created = await db
      .insert(user)
      .values(
        newUsers.slice(i, i + 1000).map((email) => ({
          name: names.get(email)!,
          email,
          emailVerified: false,
        })),
      )
      .returning({ id: user.id, email: user.email });
    for (const row of created) userIds.set(row.email!, row.id);
  }
  const newPrincipals = emails.filter((email) => !authors.has(email));
  for (let i = 0; i < newPrincipals.length; i += 1000) {
    const batch = newPrincipals.slice(i, i + 1000);
    const emailOf = new Map(batch.map((email) => [userIds.get(email)!, email]));
    const created = await db
      .insert(principal)
      .values(
        batch.map((email) => ({
          userId: userIds.get(email)!,
          role: "user",
          type: "user",
          displayName: names.get(email)!,
          createdAt: new Date(),
        })),
      )
      .returning({ id: principal.id, userId: principal.userId });
    for (const row of created) authors.set(emailOf.get(row.userId!)!, row.id);
  }

  const values = fresh.map((row) => ({
    id: createId("post"),
    row,
  }));
  const teammate = input.initiator;
  for (let i = 0; i < values.length; i += 500) {
    const batch = values.slice(i, i + 500);
    await db.insert(posts).values(
      batch.map(({ id, row }) => ({
        id,
        boardId: row.boardId,
        title: row.title,
        content: row.content,
        principalId: row.author_email
          ? authors.get(row.author_email.toLowerCase())!
          : teammate,
        statusId: row.statusId,
        ...(row.createdAt && {
          createdAt: row.createdAt,
          updatedAt: row.createdAt,
        }),
      })),
    );
    const tagRows = batch.flatMap(({ id, row }) =>
      row.tagIds.map((tagId) => ({ postId: id, tagId })),
    );
    if (tagRows.length) await db.insert(postTagAssignments).values(tagRows);
    const links = batch.flatMap(({ id, row }) =>
      row.source_id
        ? [
            {
              postId: id,
              integrationType: IMPORT_LINK,
              externalId: row.source_id,
            },
          ]
        : [],
    );
    if (links.length) await db.insert(postExternalLinks).values(links);
  }
  return totals(values.length, rows.length - fresh.length);
}
