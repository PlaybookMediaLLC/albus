import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetBoardSettings } from "../../../hooks/team/use-get-board-settings";
import { useTeamRuntime } from "../../../team/runtime";
import { PortalSheetContent } from "../../../ui/portal-sheet-content";
import {
  Sheet,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from "../../../ui/upstream";
import { AcceptPostForm, type AcceptPostFormProps } from "./accept-post-form";
import type { Signal } from "./signal-detail";

export interface AcceptPostSheetProps {
  workspaceId: string;
  /** The signal to accept. Null closes the sheet. */
  signal: Signal | null;
  boards: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: AcceptPostFormProps["onSubmit"];
}

/** The sheet that turns a signal into a new post on a board. */
export function AcceptPostSheet({
  workspaceId,
  signal,
  boards,
  onClose,
  onSubmit,
}: AcceptPostSheetProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  // The last board chosen stays chosen for the next signal.
  const [picked, setPicked] = useState<string>();
  const boardId = boards.some((board) => board.id === picked)
    ? picked!
    : (boards[0]?.id ?? "");
  // Its custom fields, internal ones included, read only while the sheet is open.
  const settings = useGetBoardSettings(
    { param: { workspaceId: signal ? workspaceId : "", boardId } },
    team.viewer,
  );
  const withFields = boards.map((board) =>
    board.id === boardId
      ? { ...board, fields: settings.data?.customFields }
      : board,
  );
  return (
    <Sheet open={Boolean(signal)} onOpenChange={(open) => !open && onClose()}>
      <PortalSheetContent>
        <SheetHeader>
          <SheetTitle>{t("autopilot.sheetTitle")}</SheetTitle>
        </SheetHeader>
        <SheetPanel>
          {signal ? (
            <AcceptPostForm
              key={signal.id}
              boards={withFields}
              defaultBoardId={boardId}
              title={signal.suggestedTitle}
              onBoardChange={setPicked}
              onSubmit={onSubmit}
            />
          ) : null}
        </SheetPanel>
      </PortalSheetContent>
    </Sheet>
  );
}
