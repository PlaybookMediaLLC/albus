import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetFile } from "../../../hooks/team/use-get-file";
import { useTeamRuntime } from "../../../team/runtime";

export interface AttachmentLinkProps {
  workspaceId: string;
  /** Null for a ref written before the file pipeline: it shows only the name. */
  fileId: string | null;
  name: string;
}

/** A file of a message: a download link once its short-lived URL loads, else its name. */
export function AttachmentLink(props: AttachmentLinkProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const file = useGetFile(
    { param: { workspaceId: props.workspaceId, fileId: props.fileId ?? "" } },
    team.viewer,
  );
  const label = t("team-conversations.attachment", { name: props.name });
  const url = file.data?.downloadUrl;
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-1 text-xs underline underline-offset-2"
    >
      <Paperclip aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  ) : (
    <p className="mt-1 text-xs opacity-80">{label}</p>
  );
}
