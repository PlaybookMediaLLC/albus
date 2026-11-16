import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { useSetPostScore } from "../../../hooks/team/use-set-post-score";
import { useTeamRuntime } from "../../../team/runtime";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { Button } from "../../../ui/upstream";
import { ScoreForm, type ScoreValues } from "./score-form";

export interface PostScoreProps {
  workspaceId: string;
  post: GetPostResponse;
  /** Refreshes the post, because setQuillsPostScore refreshes only the list. */
  onSaved: () => void;
}

/** The RICE score of a post, with its editor for teammates who can update posts. */
export function PostScore({ workspaceId, post, onSaved }: PostScoreProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const [editing, setEditing] = useState(false);
  const save = useSetPostScore(team.viewer);
  const { rice, ...score } = post.score;
  const value =
    rice === null
      ? t("team-post.notScored")
      : new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: 1,
        }).format(rice);
  return (
    <PanelSection title={t("team-post.rice")}>
      <span className="flex min-h-8 items-center justify-between gap-2 text-sm">
        {value}
        {team.permissions.update ? (
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            aria-expanded={editing}
            onClick={() => setEditing(!editing)}
          >
            {t("team-post.editScore")}
          </Button>
        ) : null}
      </span>
      {editing ? (
        <ScoreForm
          score={score as ScoreValues}
          onSubmit={async (json) => {
            await save.mutateAsync({
              param: { workspaceId, postId: post.id },
              json,
            });
            setEditing(false);
            onSaved();
          }}
        />
      ) : null}
    </PanelSection>
  );
}
