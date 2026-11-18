import { ExternalLink, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BoardDot } from "../../../ui/inbox/board-dot";
import { IconButton } from "../../../ui/inbox/icon-button";
import { StatusTabs, type StatusTab } from "../../../ui/inbox/status-tabs";
import { Button } from "../../../ui/upstream";
import type { CardDisplay, CardField } from "../card-display";
import type { RoadmapView } from "../roadmap-view";
import { RoadmapDisplayMenu } from "./roadmap-display-menu";

export interface RoadmapToolbarProps {
  view: RoadmapView;
  /** The Active, Done and All tabs with their post counts. */
  tabs: readonly StatusTab[];
  onView: (view: RoadmapView) => void;
  /** The filtered board, shown as a chip that clears the filter. */
  board: { id: string; name: string } | null;
  onClearBoard: () => void;
  display: CardDisplay;
  onDisplay: (field: CardField, on: boolean) => void;
  /** The public roadmap on the portal. */
  publicHref: string;
}

/** The row under the roadmap header: the column tabs, the board chip, Display and the public link. */
export function RoadmapToolbar(props: RoadmapToolbarProps) {
  const { t } = useTranslation("quills");
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-2 pe-4">
      <StatusTabs
        label={t("team-roadmap.views.label")}
        value={props.view}
        onChange={(next) => props.onView(next as RoadmapView)}
        tabs={props.tabs}
      />
      <div className="ms-auto mt-2 mb-2 flex shrink-0 items-center gap-1.5">
        {props.board ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label={t("team-roadmap.clearBoard", {
              name: props.board.name,
            })}
            onClick={props.onClearBoard}
          >
            <BoardDot boardId={props.board.id} />
            {props.board.name}
            <X aria-hidden="true" />
          </Button>
        ) : null}
        <RoadmapDisplayMenu
          display={props.display}
          onToggle={props.onDisplay}
        />
        <IconButton
          variant="outline"
          label={t("team-roadmap.public")}
          // shortcut: hidden on phones to keep the tabs and Display on one row; move it into a menu if phones need it.
          className="max-sm:hidden"
          render={
            <a href={props.publicHref} target="_blank" rel="noreferrer" />
          }
        >
          <ExternalLink aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
