import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { useDeleteChangelogTranslation } from "../../../hooks/team/use-delete-changelog-translation";
import { useListChangelogTranslations } from "../../../hooks/team/use-list-changelog-translations";
import { useSaveChangelogTranslation } from "../../../hooks/team/use-save-changelog-translation";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { PortalForm } from "../../../ui/portal-form";
import { Field, FieldLabel, Input, Textarea } from "../../../ui/upstream";
import { EntryLanguageList } from "./entry-language-list";

export interface EntryLanguagesProps {
  workspaceId: string;
  entryId: string;
  canEdit: boolean;
}

type Version = { locale: string; title: string; content: string };
const empty: Version = { locale: "", title: "", content: "" };

/** The entry's versions in other languages (issue #76): readers of a language get its version. */
export function EntryLanguages({
  workspaceId,
  entryId,
  canEdit,
}: EntryLanguagesProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId, entryId };
  // Closed until asked, so opening the editor reads nothing more.
  const [open, setOpen] = useState(false);
  const versions = useListChangelogTranslations(
    { param: { ...param, workspaceId: open ? workspaceId : "" } },
    team.viewer,
  );
  const save = useSaveChangelogTranslation(team.viewer);
  const remove = useDeleteChangelogTranslation(team.viewer);
  const [editing, setEditing] = useState<Version>(empty);
  const schema = z.object({
    locale: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/,
        t("team-changelog.languages.localeInvalid"),
      ),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(100000),
  });
  return (
    <section
      aria-labelledby="entry-languages-title"
      className="grid gap-3 border-t border-border pt-6"
    >
      <h2 id="entry-languages-title" className="text-sm font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="entry-languages-body"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(!open)}
        >
          {t("team-changelog.languages.title")}
        </button>
      </h2>
      {open ? (
        <div id="entry-languages-body" className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {t("team-changelog.languages.description")}
          </p>
          <TeamStateView
            loading={versions.isLoading}
            problem={versions.error}
            onRetry={() => void versions.refetch()}
          >
            <EntryLanguageList
              versions={versions.data?.items ?? []}
              deleting={
                remove.isPending ? remove.variables?.param.locale : undefined
              }
              onEdit={canEdit ? setEditing : undefined}
              onDelete={
                canEdit
                  ? (locale) =>
                      void remove
                        .mutateAsync({ param: { ...param, locale } })
                        .catch(() => undefined)
                  : undefined
              }
            />
          </TeamStateView>
          {canEdit ? (
            <PortalForm<Version>
              key={editing.locale || "new"}
              schema={schema}
              defaultValues={editing}
              submitKey="team-changelog.languages.save"
              className="max-w-none"
              onSubmit={async (values): Promise<PortalProblem | void> => {
                try {
                  await save.mutateAsync({ param, json: values });
                  setEditing(empty);
                } catch (problem) {
                  return problem as PortalProblem;
                }
              }}
            >
              {(form) => (
                <>
                  <Field invalid={Boolean(form.formState.errors.locale)}>
                    <FieldLabel htmlFor="entry-language-locale">
                      {t("team-changelog.languages.locale")}
                    </FieldLabel>
                    <Input
                      id="entry-language-locale"
                      dir="ltr"
                      autoComplete="off"
                      aria-describedby="entry-language-locale-hint"
                      {...form.register("locale")}
                    />
                    <p
                      id="entry-language-locale-hint"
                      className="text-xs text-muted-foreground"
                    >
                      {form.formState.errors.locale?.message
                        ? String(form.formState.errors.locale.message)
                        : t("team-changelog.languages.localeHint")}
                    </p>
                  </Field>
                  <Field invalid={Boolean(form.formState.errors.title)}>
                    <FieldLabel htmlFor="entry-language-title">
                      {t("team-changelog.languages.versionTitle")}
                    </FieldLabel>
                    <Input
                      id="entry-language-title"
                      dir="auto"
                      {...form.register("title")}
                    />
                  </Field>
                  <Field invalid={Boolean(form.formState.errors.content)}>
                    <FieldLabel htmlFor="entry-language-content">
                      {t("team-changelog.languages.versionContent")}
                    </FieldLabel>
                    <Textarea
                      id="entry-language-content"
                      dir="auto"
                      rows={6}
                      {...form.register("content")}
                    />
                  </Field>
                </>
              )}
            </PortalForm>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
