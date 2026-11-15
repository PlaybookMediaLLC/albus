import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "../ui/upstream";
import {
  desktopAllowed,
  readDesktopChoice,
  writeDesktopChoice,
} from "./desktop-choice";

/**
 * The sidebar row that turns desktop notifications on for this device. Turning it on asks
 * the browser for permission. The bell shows a notification while the app is in the background.
 */
export function DesktopNotifications() {
  const { t } = useTranslation("quills");
  const id = useId();
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [on, setOn] = useState(() => supported && desktopAllowed());
  const [denied, setDenied] = useState(
    () =>
      supported && readDesktopChoice() && Notification.permission === "denied",
  );
  if (!supported) return null;
  const change = async (next: boolean) => {
    const permission = next
      ? await Notification.requestPermission()
      : Notification.permission;
    const allowed = next && permission === "granted";
    writeDesktopChoice(allowed);
    setOn(allowed);
    setDenied(next && permission === "denied");
  };
  return (
    <div className="shrink-0 border-t border-border px-2 pt-3">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <p id={id} className="truncate text-sm font-medium">
            {t("team.desktop.title")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t("team.desktop.text")}
          </p>
        </div>
        <Switch
          aria-labelledby={id}
          checked={on}
          onCheckedChange={(next) => void change(next)}
        />
      </div>
      {denied ? (
        <p role="status" className="mt-2 text-xs text-destructive-foreground">
          {t("team.desktop.denied")}
        </p>
      ) : null}
    </div>
  );
}
