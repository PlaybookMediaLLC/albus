import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { listExportRunsDownload } from "../../../api/team/list-export-runs-download";
import { Button, toast } from "../../../ui/upstream";

export interface DownloadButtonProps {
  workspaceId: string;
  runId: string;
}

/** Asks for a short-lived address of a finished export when it is needed, then opens it. */
export function DownloadButton({ workspaceId, runId }: DownloadButtonProps) {
  const { t } = useTranslation("quills");
  const [pending, setPending] = useState(false);
  const download = async () => {
    setPending(true);
    try {
      const file = await listExportRunsDownload({
        param: { workspaceId, runId },
      });
      window.location.assign(file.downloadUrl);
    } catch {
      toast.error(t("settings-connections.data.downloadFailed"));
    } finally {
      setPending(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() => void download()}
    >
      <Download aria-hidden="true" />
      {t("settings-connections.data.download")}
    </Button>
  );
}
