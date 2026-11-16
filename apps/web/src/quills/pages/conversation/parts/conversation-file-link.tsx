import { useTranslation } from "react-i18next";
import { useGetMyConversationFile } from "../../../hooks/support/use-get-my-conversation-file";
import { usePortalRuntime } from "../../../portal/runtime";

export interface ConversationFileLinkProps {
  workspaceId: string;
  conversationId: string;
  fileId: string;
  name: string;
}

/** A file of a team reply: a download link once its short-lived URL loads, else its name. */
export function ConversationFileLink(props: ConversationFileLinkProps) {
  const { t } = useTranslation("quills");
  const portal = usePortalRuntime();
  const file = useGetMyConversationFile(
    {
      param: {
        workspace: props.workspaceId,
        conversationId: props.conversationId,
        fileId: props.fileId,
      },
    },
    portal.viewer,
  );
  const label = t("conversation.attachment", { name: props.name });
  const url = file.data?.downloadUrl;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="underline">
      {label}
    </a>
  ) : (
    <span>{label}</span>
  );
}
