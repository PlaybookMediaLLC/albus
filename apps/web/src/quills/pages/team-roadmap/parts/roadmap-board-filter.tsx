import { useTranslation } from "react-i18next";
import { BoardDot } from "../../../ui/inbox/board-dot";
import {
  MenuGroup,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
} from "../../../ui/upstream";

export interface RoadmapBoardFilterProps {
  boards: readonly { id: string; name: string }[];
  /** The post count of each board, from the filter counts. */
  counts: ReadonlyMap<string, number>;
  /** The chosen board, or null for every board. */
  value: string | null;
  onChange: (boardId: string | null) => void;
}

/** The filter menu items of the roadmap: every board, or one board, each with its post count. */
export function RoadmapBoardFilter(props: RoadmapBoardFilterProps) {
  const { t } = useTranslation("quills");
  const count = (value: number | undefined) =>
    value === undefined ? null : (
      <span className="ms-auto ps-4 text-faint-foreground tabular-nums">
        {value}
      </span>
    );
  return (
    <MenuGroup>
      <MenuGroupLabel>{t("team-roadmap.filterBoard")}</MenuGroupLabel>
      <MenuRadioGroup
        value={props.value ?? ""}
        onValueChange={(value) => props.onChange(String(value) || null)}
      >
        <MenuRadioItem value="">{t("team-roadmap.allBoards")}</MenuRadioItem>
        {props.boards.map((board) => (
          <MenuRadioItem key={board.id} value={board.id}>
            <span className="flex w-full items-center gap-2">
              <BoardDot boardId={board.id} />
              {board.name}
              {count(props.counts.get(board.id))}
            </span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </MenuGroup>
  );
}
