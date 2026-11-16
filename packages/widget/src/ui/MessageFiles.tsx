import { useState } from "react";

/**
 * The files a teammate sent with a message. A click opens a tab while the click still counts (a
 * popup opened after an await can be blocked), then points it at the short-lived URL from `onOpen`.
 */
export function MessageFiles({
  files = [],
  onOpen,
}: {
  files?: ReadonlyArray<{ id: string; name: string }>;
  onOpen?: (fileId: string) => Promise<string>;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!files.length) return null;
  const open = async (fileId: string) => {
    setFailed(null);
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await onOpen!(fileId);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch {
      tab?.close();
      setFailed(fileId);
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
          {failed === file.id && (
            <span role="alert"> Could not open the file. Try again.</span>
          )}
        </li>
      ))}
    </ul>
  );
}
