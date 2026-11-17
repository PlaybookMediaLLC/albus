import { ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { portalHref } from "../../core/portal-href";
import { useGetPostFilterCounts } from "../../hooks/team/use-get-post-filter-counts";
import { useListBoards } from "../../hooks/team/use-list-boards";
import { useListStatuses } from "../../hooks/team/use-list-statuses";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { ListHeader } from "../../ui/inbox/list-header";
import { PageFrame } from "../../ui/page-frame";
import { Button } from "../../ui/upstream";
import { NewRequestDialog } from "../../team/new-request/new-request-dialog";
import { RoadmapBoard } from "./parts/roadmap-board";
import {
  RoadmapTaskDialog,
  type RoadmapTaskDialogProps,
} from "./parts/roadmap-task-dialog";

export interface TeamRoadmapPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** The teammate roadmap: one column of requests per status. Moving a card changes its status. */
export function TeamRoadmapPage({ workspaceId }: TeamRoadmapPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  // The status of the open New request dialog.
  const [creating, setCreating] = useState<string | null>(null);
  const [task, setTask] = useState<RoadmapTaskDialogProps["target"]>(null);
  // Stable: the memoized card bodies must not render again on each page render.
  const openTask = useCallback<
    NonNullable<Parameters<typeof RoadmapBoard>[0]["onTask"]>
  >((post, kind) => setTask({ post, kind }), []);
  const param = { workspaceId };
  // ponytail: the first 100 statuses and boards (the API maximum); page them when a workspace has more.
  const statuses = useListStatuses(
    { param, query: { limit: "100" } },
    team.viewer,
  );
  const boards = useListBoards(
    { param, query: { offset: "0", limit: "100" } },
    team.viewer,
  );
  const counts = useGetPostFilterCounts({ param, query: {} }, team.viewer);
  // Stable maps: the memoized card lists render again only when the data changes.
  const boardNames = useMemo(
    () => new Map(boards.data?.items.map((board) => [board.id, board.name])),
    [boards.data],
  );
  const statusCounts = useMemo(
    () => new Map(counts.data?.statuses.map((row) => [row.id, row.count])),
    [counts.data],
  );

  return (
    <PageFrame titleKey="team-roadmap.title" landmark={false} variant="app">
      <ListHeader
        title={t("team-roadmap.title")}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            render={
              <a
                href={portalHref(workspaceId, "roadmap")}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink aria-hidden="true" />
            {t("team-roadmap.public")}
          </Button>
        }
      />
      {/* The right edge fades, so a cut column reads as "scroll for more". */}
      <div className="min-h-0 flex-1 overflow-x-auto mask-r-from-[calc(100%-3rem)] px-4 pb-4">
        <TeamStateView
          loading={statuses.isLoading || boards.isLoading || counts.isLoading}
          problem={statuses.error ?? boards.error ?? counts.error}
          empty={!statuses.data?.statuses.length}
          onRetry={() => {
            void statuses.refetch();
            void boards.refetch();
            void counts.refetch();
          }}
        >
          <RoadmapBoard
            workspaceId={workspaceId}
            statuses={statuses.data?.statuses ?? []}
            boards={boardNames}
            counts={statusCounts}
            onCreate={team.permissions.create ? setCreating : undefined}
            onTask={team.permissions.update ? openTask : undefined}
          />
        </TeamStateView>
      </div>
      {creating && statuses.data && boards.data ? (
        <NewRequestDialog
          workspaceId={workspaceId}
          boards={boards.data.items}
          statuses={statuses.data.statuses}
          defaultStatusId={creating}
          onClose={() => setCreating(null)}
          // The board stays open: the new card shows in its column.
          onCreated={() => setCreating(null)}
        />
      ) : null}
      <RoadmapTaskDialog
        workspaceId={workspaceId}
        target={task}
        onClose={() => setTask(null)}
      />
    </PageFrame>
  );
}
