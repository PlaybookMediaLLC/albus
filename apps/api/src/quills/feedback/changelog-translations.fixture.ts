import { changelogEntries } from "../../database/quills/schema/changelog";
import { changelogTranslations } from "../../database/quills/schema/changelog-translations";
import { fixture, type ContractEnv } from "../framework/contract";
import { softDeletes } from "./seeds.fixture";

/** An entry with a German version, in one workspace; B's entry also has a French one. */
const entryIn = (env: ContractEnv, workspaceId: string, french = false) =>
  env.scoped(workspaceId, async (db, actor) => {
    const [entry] = await db
      .insert(changelogEntries)
      .values({
        title: "Contract",
        content: "Contract",
        principalId: actor.principalId,
      })
      .returning({ id: changelogEntries.id });
    await db.insert(changelogTranslations).values([
      {
        changelogEntryId: entry!.id,
        locale: "de",
        title: "Vertrag",
        content: "Vertrag",
      },
      ...(french
        ? [
            {
              changelogEntryId: entry!.id,
              locale: "fr",
              title: "Contrat",
              content: "Contrat",
            },
          ]
        : []),
    ]);
    return entry!.id;
  });
const seed = async (env: ContractEnv) => ({
  a: await entryIn(env, env.a),
  b: await entryIn(env, env.b, true),
});
type Ids = Awaited<ReturnType<typeof seed>>;
const byEntry = (body?: object) =>
  fixture({
    seed,
    valid: ({ a }: Ids) => ({ params: { entryId: a }, body }),
    foreign: ({ b }: Ids) => ({ entryId: b }),
    softDelete: softDeletes("changelog_entries", ({ a }: Ids) => a),
  });

export const listQuillsChangelogTranslations = byEntry();
export const saveQuillsChangelogTranslation = byEntry({
  locale: "de",
  title: "Neu",
  content: "Jetzt verfügbar",
});
// The language only B has: A's entry has no French version to delete.
export const deleteQuillsChangelogTranslation = fixture({
  seed,
  valid: ({ a }: Ids) => ({ params: { entryId: a, locale: "de" } }),
  foreign: ({ b }: Ids) => ({ entryId: b, locale: "fr" }),
  softDelete: softDeletes("changelog_entries", ({ a }: Ids) => a),
});
