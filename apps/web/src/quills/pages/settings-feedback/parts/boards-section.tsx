import { LayoutList, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListBoardsResponse } from "../../../api/team/list-boards";
import { problemOf } from "../../../core/problem-of";
import { useCreateBoard } from "../../../hooks/team/use-create-board";
import { useTeamRuntime } from "../../../team/runtime";
import { NameDialog } from "../../../ui/name-dialog";
import {
  Button,
  SettingsCard,
  SettingsEmpty,
  SettingsNote,
  SettingsSection,
} from "../../../ui/upstream";
import { BoardRow } from "./board-row";

export interface BoardsSectionProps {
  workspaceId: string;
  boards: ListBoardsResponse["items"];
}

/** The feedback boards with their visibility, and "New board". */
export function BoardsSection({ workspaceId, boards }: BoardsSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const create = useCreateBoard(team.viewer);
  const [creating, setCreating] = useState(false);
  const newBoard = (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full"
      onClick={() => setCreating(true)}
    >
      <Plus aria-hidden="true" />
      {t("settings-product.boards.new")}
    </Button>
  );
  const manage = team.permissions.manageSettings;
  return (
    <SettingsSection
      title={t("settings-product.boards.title")}
      action={manage ? newBoard : null}
    >
      <SettingsCard>
        {boards.length ? (
          boards.map((board) => (
            <BoardRow key={board.id} workspaceId={workspaceId} board={board} />
          ))
        ) : (
          <SettingsEmpty
            icon={<LayoutList />}
            title={t("settings-product.boards.emptyTitle")}
            description={t("settings-product.boards.emptyText")}
            action={manage ? newBoard : undefined}
          />
        )}
      </SettingsCard>
      <SettingsNote>{t("settings-product.boards.note")}</SettingsNote>
      <NameDialog
        key={String(creating)}
        open={creating}
        onOpenChange={setCreating}
        title={t("settings-product.boards.createTitle")}
        description={t("settings-product.boards.createText")}
        label={t("settings-product.boards.name")}
        placeholder={t("settings-product.boards.placeholder")}
        maxLength={100}
        submitKey="settings-product.dialog.create"
        onSubmit={async (name) => {
          const problem = await problemOf(
            create.mutateAsync({ param: { workspaceId }, json: { name } }),
          );
          if (!problem) setCreating(false);
          return problem;
        }}
      />
    </SettingsSection>
  );
}
