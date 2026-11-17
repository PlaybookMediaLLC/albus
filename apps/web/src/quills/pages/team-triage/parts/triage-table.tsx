import { useTranslation } from "react-i18next";
import type { TriagePost } from "../../../api/team/triage-post.type";
import type { PortalProblem } from "../../../core/types";
import { Button } from "../../../ui/upstream";
import {
  FactorScoreForm,
  type Factor,
  type FactorValues,
} from "./factor-score-form";
import { ScoreForm, type ScoreValues } from "./score-form";

/** The open inline editor: a request's RICE inputs or its factor values. */
export type TriageEditing = { postId: string; mode: "rice" | "factors" };

export interface TriageTableProps {
  posts: TriagePost[];
  /** Formats a sum in cents. */
  money: (cents: number) => string;
  canScore: boolean;
  /** The teammate holds quills:view_revenue: the revenue column shows. */
  revenue: boolean;
  /** The team's scoring factors; without any, the team score cannot be edited. */
  factors: Factor[];
  editing: TriageEditing | null;
  onEdit: (editing: TriageEditing | null) => void;
  onScore: (
    postId: string,
    values: ScoreValues,
  ) => Promise<PortalProblem | void>;
  onScoreFactors: (
    postId: string,
    values: FactorValues,
  ) => Promise<PortalProblem | void>;
}

const cell = "px-3 py-2 text-right tabular-nums";
const head = "px-3 py-2 text-right font-medium whitespace-nowrap";

/** Requests with their demand, RICE and team score, and inline score editors. */
export function TriageTable(props: TriageTableProps) {
  const { t, i18n } = useTranslation("quills");
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  if (!props.posts.length)
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        {t("team-triage.none")}
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="py-2 ps-4 pe-3 text-left font-medium">
              {t("team-triage.post")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.votes")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.nice")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.important")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.critical")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.companies")}
            </th>
            {props.revenue ? (
              <th scope="col" className={head}>
                {t("team-triage.mrr")}
              </th>
            ) : null}
            <th scope="col" className={head}>
              {t("team-triage.rice")}
            </th>
            <th scope="col" className={head}>
              {t("team-triage.score")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {props.posts.flatMap((post) => {
            const mode =
              props.editing?.postId === post.id ? props.editing.mode : null;
            const edit = (next: TriageEditing["mode"]) =>
              props.onEdit(
                mode === next ? null : { postId: post.id, mode: next },
              );
            const scoreText =
              post.teamScore === null
                ? t("team-triage.unset")
                : number.format(post.teamScore);
            const { rice, ...score } = post.score;
            // The visible value starts the button's name (WCAG 2.5.3).
            const riceText =
              rice === null ? t("team-triage.unset") : number.format(rice);
            const row = (
              <tr key={post.id}>
                <th
                  scope="row"
                  className="py-2 ps-4 pe-3 text-left font-medium"
                >
                  {post.title}
                </th>
                <td className={cell}>{post.voteCount}</td>
                <td className={cell}>{post.demand.importance.nice}</td>
                <td className={cell}>{post.demand.importance.important}</td>
                <td className={cell}>{post.demand.importance.critical}</td>
                <td className={cell}>{post.demand.companies}</td>
                {props.revenue ? (
                  <td className={cell}>
                    {props.money(post.demand.mrrCents ?? 0)}
                  </td>
                ) : null}
                <td className={cell}>
                  {props.canScore ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-expanded={mode === "rice"}
                      aria-label={t("team-triage.editScore", {
                        value: riceText,
                        title: post.title,
                      })}
                      onClick={() => edit("rice")}
                    >
                      {riceText}
                    </Button>
                  ) : (
                    riceText
                  )}
                </td>
                <td className={cell}>
                  {props.canScore && props.factors.length ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-expanded={mode === "factors"}
                      aria-label={t("team-triage.editFactors", {
                        value: scoreText,
                        title: post.title,
                      })}
                      onClick={() => edit("factors")}
                    >
                      {scoreText}
                    </Button>
                  ) : (
                    scoreText
                  )}
                </td>
              </tr>
            );
            if (!mode) return [row];
            return [
              row,
              <tr key={`${post.id}-${mode}`}>
                <td
                  colSpan={props.revenue ? 9 : 8}
                  className="bg-muted/30 px-3"
                >
                  {mode === "rice" ? (
                    <ScoreForm
                      score={score as ScoreValues}
                      onSubmit={(values) => props.onScore(post.id, values)}
                    />
                  ) : (
                    <FactorScoreForm
                      factors={props.factors}
                      values={post.factorValues}
                      onSubmit={(values) =>
                        props.onScoreFactors(post.id, values)
                      }
                    />
                  )}
                </td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
