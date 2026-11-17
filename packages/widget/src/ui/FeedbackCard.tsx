import { useId } from "react";
import { useAction } from "./useAction.js";
import type { Conversation } from "./types.js";
import { useT } from "./i18n/useT.js";

type Card = NonNullable<Conversation["messages"][number]["feedbackCard"]>;

/** A request the assistant proposed in the chat: the visitor submits it once, or ignores it. */
export function FeedbackCard({
  card,
  onConfirm,
  offline,
}: {
  card: Card;
  onConfirm?: () => Promise<unknown>;
  offline?: boolean;
}) {
  const t = useT();
  const id = useId();
  const action = useAction();
  return (
    <section className="qb-contact-email" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{card.title}</h2>
      {card.body && <p>{card.body}</p>}
      {card.confirmed ? (
        <p role="status">{t("Request submitted")}</p>
      ) : (
        onConfirm && (
          <button
            type="button"
            className="qb-card-action"
            disabled={offline || action.pending}
            onClick={() => void action.run(onConfirm)}
          >
            {action.pending ? t("Sending…") : t("Submit request")}
          </button>
        )
      )}
      {action.error && (
        <p className="qb-form-error" role="alert">
          {action.error}
        </p>
      )}
    </section>
  );
}
