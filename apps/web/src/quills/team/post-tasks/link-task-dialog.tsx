import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLinkPostToTask } from "../../hooks/team/use-link-post-to-task";
import { useTeamRuntime } from "../runtime";
import { StateView } from "../../ui/state-view";
import {
  Button,
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  useDebouncedValue,
  useGlobalSearch,
} from "../../ui/upstream";

export interface LinkTaskDialogProps {
  workspaceId: string;
  postId: string;
  onClose: () => void;
}

/**
 * Links a request to an existing Kaneo task (RFC 0005, 7.2). Kaneo's search finds tasks by key or title
 * in the projects the teammate can open; the link route checks the task's own project again.
 */
export function LinkTaskDialog(props: LinkTaskDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const id = useId();
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim(), 250);
  const search = useGlobalSearch({
    q,
    type: "tasks",
    workspaceId: props.workspaceId,
    limit: 10,
  });
  const link = useLinkPostToTask(team.viewer);
  const tasks = (search.data?.results ?? []).filter(
    (result) => result.type === "task",
  );
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) props.onClose();
      }}
    >
      <DialogPopup className="gap-3 p-6">
        <DialogHeader className="p-0">
          <DialogTitle>{t("team-post.linkTaskTitle")}</DialogTitle>
          <DialogDescription>{t("team-post.linkTaskText")}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={id}>{t("team-post.linkTaskSearch")}</FieldLabel>
          <Input
            id={id}
            type="search"
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        {link.error ? (
          <p role="alert" className="text-sm text-destructive-foreground">
            {t("core.problem.failed")}
          </p>
        ) : null}
        {q ? (
          <StateView
            loading={search.isLoading}
            problem={search.error ? { kind: "failed" } : null}
            empty={!tasks.length}
            emptyDescription={t("team-post.linkTaskNone")}
          >
            <ul className="grid gap-1">
              {tasks.map((task) => {
                const key =
                  task.projectSlug && task.taskNumber
                    ? `${task.projectSlug}-${task.taskNumber}`
                    : "";
                return (
                  <li key={task.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      loading={
                        link.isPending &&
                        link.variables?.param.taskId === task.id
                      }
                      disabled={link.isPending}
                      aria-label={t("team-post.linkTaskPick", {
                        key,
                        title: task.title,
                      })}
                      onClick={() =>
                        link.mutate(
                          {
                            param: {
                              workspaceId: props.workspaceId,
                              postId: props.postId,
                              taskId: task.id,
                            },
                          },
                          { onSuccess: props.onClose },
                        )
                      }
                    >
                      {key ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {key}
                        </span>
                      ) : null}
                      <span className="truncate">{task.title}</span>
                      {task.projectName ? (
                        <span className="ms-auto truncate text-xs text-muted-foreground">
                          {task.projectName}
                        </span>
                      ) : null}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </StateView>
        ) : null}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={props.onClose}>
            {t("team-post.cancel")}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
