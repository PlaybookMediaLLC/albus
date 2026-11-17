import { useState } from "react";
import { useT } from "./i18n/useT.js";

/**
 * The files a teammate sent with a message. A click opens a tab while the click still counts (a
 * popup opened after an await can be blocked), then points it at the short-lived URL from `onOpen`.
 * The widget frame never navigates: an image would replace the widget. A blocked tab is a failure.
 */
export function MessageFiles({
  files = [],
  onOpen,
}: {
  files?: ReadonlyArray<{ id: string; name: string }>;
  onOpen?: (fileId: string) => Promise<string>;
}) {
  const t = useT();
  // The file that could not open, and whether the browser blocked its tab.
  const [failed, setFailed] = useState<{ id: string; blocked: boolean } | null>(
    null,
  );
  if (!files.length) return null;
  const open = async (fileId: string) => {
    setFailed(null);
    const tab = window.open("", "_blank");
    if (!tab) {
      setFailed({ id: fileId, blocked: true });
      return;
    }
    tab.opener = null;
    try {
      tab.location.href = await onOpen!(fileId);
    } catch {
      tab.close();
      setFailed({ id: fileId, blocked: false });
    }
  };
  return (
    <ul className="qb-message-files">
      {files.map((file) => (
        <li key={file.id}>
          {onOpen ? (
            <button type="button" onClick={() => void open(file.id)}>
              {file.name}
            </button>
          ) : (
            <span>{file.name}</span>
          )}
          {failed?.id === file.id && (
            <span role="alert">
              {" "}
              {failed.blocked
                ? t("Could not open the file. Allow pop-ups for this page.")
                : t("Could not open the file. Try again.")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
