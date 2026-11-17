import { and, asc, eq, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { ChangelogId } from "@kaneo/ids";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import {
  apiRouter,
  responseTimestamp,
  z,
  type BaseVariables,
} from "../../openapi";
import { changelogEntries } from "../../database/quills/schema/changelog";
import { changelogTranslations } from "../../database/quills/schema/changelog-translations";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import { language } from "../portal/translations";

// Changelog entries in more than one language (issue #76). A teammate writes each version; the
// entry's own title and content are the default language. The portal, the widget and the
// changelog mail pick the reader's language, else the default (portal/feedback/changelog.ts).

const locale = z
  .string()
  .trim()
  .min(2)
  .max(35)
  .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a BCP 47 language tag")
  .transform(language)
  .openapi({
    description:
      "A BCP 47 tag. It is stored as its language (de-AT is de; Chinese keeps zh-cn or zh-tw).",
  });
const entryParams = z.object({ entryId: flexibleToTypeIdSchema("changelog") });
const versionParams = entryParams.extend({ locale });
const version = z.object({
  locale: z.string(),
  title: z.string(),
  content: z.string(),
  updatedAt: responseTimestamp,
});
const notFound = (what: string) =>
  new HTTPException(404, { message: `${what} not found` });

/** The live entry, or 404. */
async function liveEntry(db: Database, id: ChangelogId) {
  const [row] = await db
    .select({ id: changelogEntries.id })
    .from(changelogEntries)
    .where(
      and(eq(changelogEntries.id, id), isNull(changelogEntries.deletedAt)),
    );
  if (!row) throw notFound("Changelog entry");
  return row;
}

const list = defineQuillsRoute({
  method: "get",
  path: "/changelog/{entryId}/translations",
  operationId: "listQuillsChangelogTranslations",
  summary: "List the other-language versions of a changelog entry",
  action: "read",
  params: entryParams,
  response: z.object({ items: z.array(version) }),
  responseDescription: "Versions by language",
  errors: { 404: "Changelog entry not found" },
  handler: async ({ db, params }) => {
    await liveEntry(db, params.entryId);
    const items = await db
      .select({
        locale: changelogTranslations.locale,
        title: changelogTranslations.title,
        content: changelogTranslations.content,
        updatedAt: changelogTranslations.updatedAt,
      })
      .from(changelogTranslations)
      .where(eq(changelogTranslations.changelogEntryId, params.entryId))
      .orderBy(asc(changelogTranslations.locale));
    return { items };
  },
});

const save = defineQuillsRoute({
  method: "put",
  path: "/changelog/{entryId}/translations",
  operationId: "saveQuillsChangelogTranslation",
  summary: "Write a changelog entry's version in one language",
  description:
    "Creates or replaces the version in `locale`. Readers whose language it is get it in the portal, the widget and the changelog mail; others get the entry's own text.",
  action: "update",
  params: entryParams,
  body: z.object({
    locale,
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(100000),
  }),
  response: version,
  responseDescription: "The saved version",
  errors: { 404: "Changelog entry not found" },
  event: ({ params, body }) => ({
    type: "changelog.translation_saved",
    entityType: "changelog",
    entityId: params.entryId,
    payload: { locale: body.locale },
  }),
  handler: async ({ db, params, body }) => {
    await liveEntry(db, params.entryId);
    const now = new Date();
    const [row] = await db
      .insert(changelogTranslations)
      .values({
        changelogEntryId: params.entryId,
        locale: body.locale,
        title: body.title,
        content: body.content,
      })
      .onConflictDoUpdate({
        target: [
          changelogTranslations.workspaceId,
          changelogTranslations.changelogEntryId,
          changelogTranslations.locale,
        ],
        set: { title: body.title, content: body.content, updatedAt: now },
      })
      .returning({
        locale: changelogTranslations.locale,
        title: changelogTranslations.title,
        content: changelogTranslations.content,
        updatedAt: changelogTranslations.updatedAt,
      });
    return row!;
  },
});

const remove = defineQuillsRoute({
  method: "delete",
  path: "/changelog/{entryId}/translations/{locale}",
  operationId: "deleteQuillsChangelogTranslation",
  summary: "Delete a changelog entry's version in one language",
  description: "Readers of that language then get the entry's own text.",
  action: "update",
  params: versionParams,
  response: z.object({ deleted: z.literal(true) }),
  responseDescription: "The version was deleted",
  errors: { 404: "Changelog entry or version not found" },
  event: ({ params }) => ({
    type: "changelog.translation_deleted",
    entityType: "changelog",
    entityId: params.entryId,
    payload: { locale: params.locale },
  }),
  handler: async ({ db, params }) => {
    await liveEntry(db, params.entryId);
    const deleted = await db
      .delete(changelogTranslations)
      .where(
        and(
          eq(changelogTranslations.changelogEntryId, params.entryId),
          eq(changelogTranslations.locale, params.locale),
        ),
      )
      .returning({ locale: changelogTranslations.locale });
    if (!deleted.length) throw notFound("Changelog version");
    return { deleted: true as const };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...list)
  .openapi(...save)
  .openapi(...remove);
