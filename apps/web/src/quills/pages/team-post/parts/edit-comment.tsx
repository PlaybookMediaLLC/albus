import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateComment } from "../../../hooks/team/use-update-comment";
import { useTeamRuntime } from "../../../team/runtime";
import { Composer } from "../../../ui/inbox/composer";
import { Button } from "../../../ui/upstream";

export interface EditCommentProps {
  workspaceId: string;
  commentId: string;
  content: string;
  onDone: () => void;
}

/** Edits a comment in place. Enter saves; Escape or Cancel keeps the old text. */
export function EditComment(props: EditCommentProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [text, setText] = useState(props.content);
  const update = useUpdateComment(team.viewer);
  return (
    <div
      role="group"
      aria-label={t("team-post.editComment")}
      className="mt-1 grid gap-1"
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onDone();
      }}
    >
      <Composer
        label={t("team-post.editComment")}
        value={text}
        onChange={setText}
        sending={update.isPending}
        onSend={() =>
          update.mutate(
            {
              param: {
                workspaceId: props.workspaceId,
                commentId: props.commentId,
              },
              json: { content: text.trim() },
            },
            { onSuccess: props.onDone },
          )
        }
      />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="xs" onClick={props.onDone}>
          {t("team-post.cancel")}
        </Button>
        {update.error ? (
          <p role="alert" className="text-sm text-destructive-foreground">
            {t("core.problem.failed")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
