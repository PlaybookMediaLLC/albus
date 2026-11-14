import { FileDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { useCreateExportWorkspace } from "../../../hooks/team/use-create-export-workspace";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  toast,
} from "../../../ui/upstream";
import { ExportForm } from "./export-form";
import { NavRow } from "./nav-row";

export interface ExportDialogProps {
  workspaceId: string;
}

/** "Export to CSV": choose the data, then queue the export. The run list shows it. */
export function ExportDialog({ workspaceId }: ExportDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [open, setOpen] = useState(false);
  const create = useCreateExportWorkspace(team.viewer);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <NavRow
            icon={FileDown}
            title={t("settings-connections.data.exportCsv")}
            text={t("settings-connections.data.exportCsvText")}
          />
        }
      />
      <DialogPopup className="gap-4 p-6">
        <DialogTitle>{t("settings-connections.data.exportCsv")}</DialogTitle>
        <DialogDescription>
          {t("settings-connections.data.exportText")}
        </DialogDescription>
        <ExportForm
          onSubmit={async (json): Promise<PortalProblem | void> => {
            try {
              await create.mutateAsync({ param: { workspaceId }, json });
              setOpen(false);
              toast.success(t("settings-connections.data.exportStarted"));
            } catch (error) {
              const problem = error as PortalProblem;
              if (problem.kind !== "conflict") return problem;
              // The one conflict here: an export of this workspace still runs. Keep the form usable.
              toast.error(t("settings-connections.data.exportRunning"));
            }
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}
