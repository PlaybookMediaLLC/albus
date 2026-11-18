import { useRef, useState } from "react";
import { Avatar } from "./Avatar.js";
import { useT } from "./i18n/useT.js";
import type { WidgetViewProps } from "./types.js";

/** Home's "Your picture" row for a visitor that the host app identified: change or remove it. */
export function AvatarSetting({
  change,
}: {
  change: NonNullable<WidgetViewProps["onChangeAvatar"]>;
}) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "saved" | "failed">(
    "idle",
  );
  const run = async (file: File | null) => {
    setState("busy");
    try {
      setUrl(await change(file));
      setState("saved");
    } catch {
      setState("failed");
    }
  };
  return (
    <div className="qb-avatar-setting">
      <Avatar name={t("Your picture")} avatarUrl={url ?? undefined} />
      <span>
        <strong>{t("Your picture")}</strong>
        {state === "failed" ? (
          <small role="alert">{t("Could not save the picture.")}</small>
        ) : state === "saved" ? (
          <small role="status">{t("Picture updated")}</small>
        ) : (
          <small>{t("Shown next to your feedback and messages.")}</small>
        )}
      </span>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void run(file);
        }}
      />
      <button
        type="button"
        className="qb-text-button"
        disabled={state === "busy"}
        onClick={() => input.current?.click()}
      >
        {t("Change picture")}
      </button>
      {url ? (
        <button
          type="button"
          className="qb-text-button"
          disabled={state === "busy"}
          onClick={() => void run(null)}
        >
          {t("Remove")}
        </button>
      ) : null}
    </div>
  );
}
