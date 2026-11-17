import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { typeIdColumn } from "@kaneo/ids/drizzle";
import { quillsSchema, workspaceColumn, workspacePolicy } from "../tenancy";
import { changelogEntries } from "./changelog";

/**
 * A version of a changelog entry in another language, written by a teammate (issue #76). The
 * entry's own title and content are the default language. `locale` is the language subtag that
 * readers ask for (`de`, `pt`, or `zh-cn` and `zh-tw`), one version per language. Deleting the
 * entry deletes its versions; a soft-deleted entry keeps them.
 */
export const changelogTranslations = quillsSchema
  .table(
    "changelog_translations",
    {
      workspaceId: workspaceColumn(),
      changelogEntryId:
        typeIdColumn("changelog")("changelog_entry_id").notNull(),
      locale: text("locale").notNull(),
      title: text("title").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      primaryKey({
        name: "changelog_translations_pk",
        columns: [table.workspaceId, table.changelogEntryId, table.locale],
      }),
      check(
        "changelog_translations_locale_check",
        sql`${table.locale} ~ '^[a-z]{2,3}(-[a-z]{2,4})?$'`,
      ),
      check(
        "changelog_translations_title_check",
        sql`char_length(${table.title}) BETWEEN 1 AND 200`,
      ),
      check(
        "changelog_translations_content_check",
        sql`char_length(${table.content}) BETWEEN 1 AND 100000`,
      ),
      foreignKey({
        name: "changelog_translations_entry_fk",
        columns: [table.workspaceId, table.changelogEntryId],
        foreignColumns: [changelogEntries.workspaceId, changelogEntries.id],
      }).onDelete("cascade"),
      workspacePolicy(table.workspaceId),
    ],
  )
  .enableRLS();
