import { useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetChangelogEntryResponse } from "../../api/team/get-changelog-entry";
import { useGetAssistantSettings } from "../../hooks/team/use-get-assistant-settings";
import { useGetChangelogEntry } from "../../hooks/team/use-get-changelog-entry";
import { teamHref } from "../../team/team-href";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { IconButton } from "../../ui/inbox/icon-button";
import { PageFrame } from "../../ui/page-frame";
import { EntryEditor } from "./parts/entry-editor";

export interface TeamChangelogEntryPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * The full-page changelog editor (settings spec A4) in the "focus" shell mode. The entry ID
 * "new" starts a new entry. Its first save replaces the address with the real ID; the route
 * stays the same, so the editor keeps the text that the user typed meanwhile.
 */
export function TeamChangelogEntryPage({
  workspaceId,
  params,
}: TeamChangelogEntryPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const router = useRouter();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const entryId = params.entryId ?? "new";
  const isNew = entryId === "new";
  // An empty workspace ID keeps the read off for a new entry.
  const entry = useGetChangelogEntry(
    { param: { workspaceId: isNew ? "" : workspaceId, entryId } },
    team.viewer,
  );
  const assistant = useGetAssistantSettings(
    { param: { workspaceId } },
    team.viewer,
  );
  const [created, setCreated] = useState<GetChangelogEntryResponse | null>(
    null,
  );
  const current = entry.data ?? created;
  const back = () => void navigate({ to: teamHref(workspaceId, "/changelog") });
  return (
    <PageFrame
      titleKey="team-changelog.editor.pageTitle"
      displayTitle={current?.title || undefined}
      variant="app"
      landmark={false}
    >
      <h1 tabIndex={-1} className="sr-only">
        {current?.title || t("team-changelog.editor.pageTitle")}
      </h1>
      {isNew || current ? (
        <EntryEditor
          workspaceId={workspaceId}
          entry={current}
          aiOn={assistant.data?.aiConfigured ?? false}
          onCreated={(made) => {
            // A create that ends after the user left must not bring them back.
            const newHref = teamHref(workspaceId, "/changelog/new");
            if (!mounted.current || router.state.location.pathname !== newHref)
              return;
            setCreated(made);
            void navigate({
              to: teamHref(workspaceId, `/changelog/${made.id}`),
              replace: true,
            });
          }}
          onBack={back}
        />
      ) : (
        <div className="grid gap-4 px-3 py-2">
          <IconButton label={t("team-changelog.editor.back")} onClick={back}>
            <ChevronLeft aria-hidden="true" />
          </IconButton>
          <div className="mx-auto w-full max-w-180 px-3">
            <TeamStateView
              loading={entry.isLoading}
              problem={entry.error}
              onRetry={() => void entry.refetch()}
            >
              {null}
            </TeamStateView>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
