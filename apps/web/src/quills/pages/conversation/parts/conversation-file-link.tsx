import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyConversationFile } from "../../../api/support/get-my-conversation-file";
import { openDownload } from "../../../core/open-download";

export interface ConversationFileLinkProps {
  workspaceId: string;
  conversationId: string;
  fileId: string;
  name: string;
}

/** A file of a team reply. A click asks for a short-lived download URL and opens it. */
export function ConversationFileLink(props: ConversationFileLinkProps) {
  const { t } = useTranslation("quills");
  const [state, setState] = useState<"idle" | "opening" | "failed">("idle");
  const open = async () => {
    setState("opening");
    try {
      await openDownload(
        async () =>
          (
            await getMyConversationFile({
              param: {
                workspace: props.workspaceId,
                conversationId: props.conversationId,
                fileId: props.fileId,
              },
            })
          ).downloadUrl,
      );
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <>
      <button
        type="button"
        disabled={state === "opening"}
        onClick={() => void open()}
        className="underline disabled:opacity-60"
      >
        {t("conversation.attachment", { name: props.name })}
      </button>
      {state === "failed" ? (
        <span role="alert"> {t("conversation.attachmentFailed")}</span>
      ) : null}
    </>
  );
}
