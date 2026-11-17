import { useState } from "react";
import { Icon } from "./Icon.js";
import type { WidgetViewProps } from "./types.js";
import { useT } from "./i18n/useT.js";

/** "Open in portal": a new tab signs the identified visitor in, or Kaneo mails them a sign-in link. */
export function PortalLink({
  send,
}: {
  send: NonNullable<WidgetViewProps["onOpenPortal"]>;
}) {
  const t = useT();
  const [state, setState] = useState<
    "idle" | "sending" | "opened" | "sent" | "if_account" | "failed"
  >("idle");
  return (
    <>
      {/* Stays mounted: focus is kept, and a visitor whose link expired asks again. */}
      <button
        type="button"
        className="qb-quick-link"
        disabled={state === "sending"}
        onClick={() => {
          setState("sending");
          send().then(setState, () => setState("failed"));
        }}
      >
        <Icon name="external" />
        <span>{t("Open in portal")}</span>
        <Icon name="chevron" />
      </button>
      {state === "sent" && (
        <p className="qb-notice" role="status">
          {t("Check your email for a sign-in link to the portal.")}
        </p>
      )}
      {/* Registration is closed: the API never says whether this address has an account. */}
      {state === "if_account" && (
        <p className="qb-notice" role="status">
          {t(
            "If your email has an account on the portal, a sign-in link is on its way. Check your email.",
          )}
        </p>
      )}
      {state === "failed" && (
        <p className="qb-form-error" role="alert">
          {t("The portal could not be opened. Try again later.")}
        </p>
      )}
    </>
  );
}
