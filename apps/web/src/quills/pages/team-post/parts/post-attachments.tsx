import { Paperclip } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFile } from "../../../api/team/get-file";
import type { GetPostResponse } from "../../../api/team/get-post";
import { openDownload } from "../../../core/open-download";

export interface PostAttachmentsProps {
  workspaceId: string;
  post: GetPostResponse;
}

/**
 * The images the author attached, such as a widget screenshot. A click asks for a short-lived
 * download URL, so the page sends no request per file until a teammate opens one.
 */
export function PostAttachments({ workspaceId, post }: PostAttachmentsProps) {
  const { t } = useTranslation("quills");
  const heading = useId();
  const [failed, setFailed] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  if (!post.attachments?.length) return null;
  const open = async (fileId: string) => {
    setOpening(fileId);
    setFailed(null);
    try {
      await openDownload(
        async () =>
          (await getFile({ param: { workspaceId, fileId } })).downloadUrl,
      );
    } catch {
      setFailed(fileId);
    } finally {
      setOpening(null);
    }
  };
  return (
    <section aria-labelledby={heading} className="grid gap-2 py-3 text-sm">
      <h3 id={heading} className="text-xs font-medium text-muted-foreground">
        {t("team-post.attachments.title")}
      </h3>
      <ul className="grid gap-1">
        {post.attachments.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              disabled={opening === file.id}
              onClick={() => void open(file.id)}
              aria-label={t("team-post.attachments.open", { name: file.name })}
              className="inline-flex max-w-full items-center gap-1 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Paperclip aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>
            {failed === file.id ? (
              <span role="alert" className="ms-2 text-xs">
                {t("team-post.attachments.failed")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
