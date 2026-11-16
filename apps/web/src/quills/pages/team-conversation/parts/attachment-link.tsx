import { Paperclip } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getFile } from "../../../api/team/get-file";
import { openDownload } from "../../../core/open-download";

export interface AttachmentLinkProps {
  workspaceId: string;
  /** Null for a ref written before the file pipeline: it shows only the name. */
  fileId: string | null;
  name: string;
}

/**
 * A file of a message. A click asks for a short-lived download URL and opens it, so the link never
 * goes stale and an open thread sends no request per file.
 */
export function AttachmentLink(props: AttachmentLinkProps) {
  const { t } = useTranslation("quills");
  const [state, setState] = useState<"idle" | "opening" | "failed">("idle");
  const label = t("team-conversations.attachment", { name: props.name });
  const { fileId } = props;
  if (!fileId) return <p className="mt-1 text-xs opacity-80">{label}</p>;
  const open = async () => {
    setState("opening");
    try {
      await openDownload(
        async () =>
          (
            await getFile({
              param: { workspaceId: props.workspaceId, fileId },
            })
          ).downloadUrl,
      );
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <p className="mt-1 text-xs">
      <button
        type="button"
        disabled={state === "opening"}
        onClick={() => void open()}
        className="inline-flex max-w-full items-center gap-1 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <Paperclip aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {state === "failed" ? (
        <span role="alert" className="ms-2">
          {t("team-conversations.attachmentFailed")}
        </span>
      ) : null}
    </p>
  );
}
