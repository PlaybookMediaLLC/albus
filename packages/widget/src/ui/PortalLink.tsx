import { useState } from "react";
import { Icon } from "./Icon.js";

/** "Open in portal": the host mails a sign-in link to the identified visitor's email. */
export function PortalLink({
  send,
}: {
  send: () => Promise<"sent" | "if_account">;
}) {
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "if_account" | "failed"
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
        <span>Open in portal</span>
        <Icon name="chevron" />
      </button>
      {state === "sent" && (
        <p className="qb-notice" role="status">
          Check your email for a sign-in link to the portal.
        </p>
      )}
      {/* Registration is closed: the API never says whether this address has an account. */}
      {state === "if_account" && (
        <p className="qb-notice" role="status">
          If your email has an account on the portal, a sign-in link is on its
          way. Check your email.
        </p>
      )}
      {state === "failed" && (
        <p className="qb-form-error" role="alert">
          The sign-in link could not be sent. Try again later.
        </p>
      )}
    </>
  );
}
