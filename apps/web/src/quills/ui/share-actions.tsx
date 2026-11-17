import {
  IconLinkOutline18,
  IconPaperPlane2Outline18,
} from "nucleo-ui-essential-outline-18";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./upstream";

export interface ShareActionsProps {
  className?: string;
  /** One share icon button that copies the link when the browser cannot share. */
  compact?: boolean;
}

// A quiet ghost action. The list's negative margin lines the text up with the headings.
const action =
  "w-full justify-start text-muted-foreground hover:text-foreground";

/** Copy or share the current page address. */
export function ShareActions({ className, compact }: ShareActionsProps) {
  const { t } = useTranslation("quills");
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage(t("core.linkCopied"));
    } catch {
      setMessage(t("core.copyFailed"));
    }
  };
  const share = async () => {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
      setMessage("");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError")
        setMessage(t("core.shareFailed"));
    }
  };
  const live = (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {message}
    </p>
  );
  if (compact)
    return (
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        {live}
        <Button
          variant="secondary"
          size="icon-xs"
          className="rounded-full before:rounded-full"
          aria-label={t("core.share")}
          title={t("core.share")}
          onClick={() =>
            void (typeof navigator.share === "function" ? share() : copy())
          }
        >
          <IconPaperPlane2Outline18 aria-hidden="true" />
        </Button>
      </div>
    );
  return (
    <div className={className}>
      <ul className="-mx-2 grid gap-0.5">
        <li>
          <Button
            variant="ghost"
            size="sm"
            className={action}
            onClick={() => void copy()}
          >
            <IconLinkOutline18 aria-hidden="true" />
            {t("core.copyLink")}
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="sm"
            className={action}
            onClick={() => void share()}
          >
            <IconPaperPlane2Outline18 aria-hidden="true" />
            {t("core.share")}
          </Button>
        </li>
      </ul>
      <div className="mt-1 max-w-44">{live}</div>
    </div>
  );
}
