import { useId, useState } from "react";
import { useAction } from "./useAction.js";
import type { ContactEmail, WidgetViewProps } from "./types.js";
import { useT } from "./i18n/useT.js";

/**
 * Lets an anonymous visitor get replies by email: a code goes to the address, and the address is
 * set once the code is right. The visitor can skip it; nothing is required to chat.
 */
export function ContactEmailCard({
  contact,
  onRequest,
  onConfirm,
  offline,
}: {
  contact: ContactEmail;
  onRequest: NonNullable<WidgetViewProps["onRequestContactEmail"]>;
  onConfirm: NonNullable<WidgetViewProps["onConfirmContactEmail"]>;
  offline?: boolean;
}) {
  const t = useT();
  const id = useId();
  const action = useAction();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(contact.pendingEmail ?? "");
  const [code, setCode] = useState("");
  const pending =
    contact.pendingEmail && !editing ? contact.pendingEmail : null;
  // A set address changes only with a code mailed to it: the widget shows it and stops here.
  if (contact.email)
    return (
      <section className="qb-contact-email" aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`}>{t("Replies by email")}</h2>
        <p>{t("Replies also go to {email}.", { email: contact.email })}</p>
      </section>
    );
  return (
    <section className="qb-contact-email" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{t("Get replies by email")}</h2>
      {pending ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(async () => {
              await onConfirm(pending, code.trim());
              setCode("");
            });
          }}
        >
          <label htmlFor={`${id}-code`}>
            {t("Enter the code we sent to {email}", { email: pending })}
          </label>
          <input
            id={`${id}-code`}
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={(event) => setCode(event.target.value)}
          />
          <button
            type="submit"
            disabled={!code.trim() || offline || action.pending}
          >
            {action.pending ? t("Checking…") : t("Confirm")}
          </button>
          <button
            type="button"
            className="qb-text-button"
            onClick={() => setEditing(true)}
          >
            {t("Use another address")}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(async () => {
              await onRequest(email.trim());
              setEditing(false);
            });
          }}
        >
          <label htmlFor={`${id}-email`}>
            {t("Your email, so you see replies after you leave")}
          </label>
          <input
            id={`${id}-email`}
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            disabled={!email.trim() || offline || action.pending}
          >
            {action.pending ? t("Sending…") : t("Send code")}
          </button>
        </form>
      )}
      {action.error && <p role="alert">{action.error}</p>}
    </section>
  );
}
