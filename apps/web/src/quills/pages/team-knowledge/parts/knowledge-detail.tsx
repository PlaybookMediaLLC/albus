import { useTranslation } from "react-i18next";
import type { GetKnowledgeSuggestionResponse } from "../../../api/team/get-knowledge-suggestion";
import {
  KnowledgeDraft,
  type KnowledgeAudience,
  type KnowledgeDraftValues,
} from "./knowledge-draft";
import type { PortalProblem } from "../../../core/types";
import { KnowledgeQuestion } from "./knowledge-question";

export type KnowledgeSuggestionDetail = GetKnowledgeSuggestionResponse;

export interface KnowledgeDetailProps {
  suggestion: KnowledgeSuggestionDetail;
  audience: KnowledgeAudience;
  busy: boolean;
  onAudienceChange: (audience: KnowledgeAudience) => void;
  onAnswer: (answer: string) => Promise<PortalProblem | void>;
  onSkip: () => void;
  onSave: (values: KnowledgeDraftValues) => Promise<PortalProblem | void>;
  onDraftChange: (values: KnowledgeDraftValues) => void;
}

const muted = "text-sm text-muted-foreground";

/** The open suggestion: the customer question, what the AI found, the answers, and the current step. */
export function KnowledgeDetail({
  suggestion,
  ...props
}: KnowledgeDetailProps) {
  const { t } = useTranslation("quills");
  const answered = suggestion.questions.filter(
    (item) => item.answer !== null || item.skipped,
  );
  const next = suggestion.questions[suggestion.stepIndex];
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-4 px-6 py-5">
      <section aria-label={t("knowledge.topic")} className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {t("knowledge.topic")}
        </p>
        <p className="font-medium">{suggestion.topic}</p>
      </section>
      <section aria-label={t("knowledge.found")} className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {t("knowledge.found")}
        </p>
        <p className="font-medium">{suggestion.candidateTitle}</p>
        <p className={muted}>{suggestion.candidateContent}</p>
      </section>
      {answered.length ? (
        <section aria-label={t("knowledge.answers")} className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            {t("knowledge.answers")}
          </p>
          <ol className="grid gap-2">
            {answered.map((item) => (
              <li key={item.position}>
                <p className="text-sm font-medium">{item.question}</p>
                <p className={muted}>
                  {item.skipped ? t("knowledge.skipped") : item.answer}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {suggestion.status === "awaiting_answer" && next ? (
        <KnowledgeQuestion
          key={next.position}
          question={next.question}
          suggestedAnswers={next.suggestedAnswers}
          number={suggestion.stepIndex + 1}
          total={suggestion.questionCount}
          busy={props.busy}
          onAnswer={props.onAnswer}
          onSkip={props.onSkip}
        />
      ) : null}
      {suggestion.status === "drafting" ? (
        <p role="status" className={muted}>
          {t("knowledge.drafting")}
        </p>
      ) : null}
      {suggestion.status === "draft_ready" &&
      suggestion.title &&
      suggestion.content ? (
        <KnowledgeDraft
          values={{ title: suggestion.title, content: suggestion.content }}
          audience={props.audience}
          onAudienceChange={props.onAudienceChange}
          onSave={props.onSave}
          onChange={props.onDraftChange}
        />
      ) : null}
      {suggestion.status === "approved" || suggestion.status === "dismissed" ? (
        <section className="grid gap-1">
          <p className="font-medium">
            {suggestion.title ?? suggestion.candidateTitle}
          </p>
          <p className={muted}>
            {suggestion.content ?? suggestion.candidateContent}
          </p>
        </section>
      ) : null}
    </article>
  );
}
