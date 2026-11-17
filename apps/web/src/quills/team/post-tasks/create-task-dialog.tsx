import { useId } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../core/types";
import { useCreatePostTask } from "../../hooks/team/use-create-post-task";
import { useGetBoardSettings } from "../../hooks/team/use-get-board-settings";
import { useTeamRuntime } from "../runtime";
import { FormSelect } from "../../ui/form-select";
import { PortalForm } from "../../ui/portal-form";
import { StateView } from "../../ui/state-view";
import {
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  useGetProjects,
} from "../../ui/upstream";
import { ColumnField } from "./column-field";

const schema = z.object({
  projectId: z.string().min(1),
  columnId: z.string().nullable(),
  title: z.string().trim().min(1).max(500),
});
type Values = z.infer<typeof schema>;

export interface CreateTaskDialogProps {
  workspaceId: string;
  post: { id: string; title: string; boardId: string };
  onClose: () => void;
}

/**
 * Creates a Kaneo task from a request, as the teammate (RFC 0005, 5.1). The board's delivery project is
 * the default. Kaneo lists only the projects the teammate can open; the API checks task:create again.
 */
export function CreateTaskDialog(props: CreateTaskDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const id = useId();
  const projects = useGetProjects({ workspaceId: props.workspaceId });
  const settings = useGetBoardSettings(
    { param: { workspaceId: props.workspaceId, boardId: props.post.boardId } },
    team.viewer,
  );
  const create = useCreatePostTask(team.viewer);
  const open = (projects.data ?? []).filter((project) => !project.archivedAt);
  const delivery = settings.data?.delivery;
  const projectId =
    open.find((project) => project.id === delivery?.projectId)?.id ??
    open[0]?.id ??
    "";
  const submit = async (values: Values): Promise<PortalProblem | void> => {
    try {
      await create.mutateAsync({
        param: { workspaceId: props.workspaceId, postId: props.post.id },
        json: values,
      });
      props.onClose();
    } catch (error) {
      const problem = error as PortalProblem;
      if (problem.kind === "noAccess" || problem.kind === "conflict")
        return {
          kind: "invalid",
          issues: [
            {
              path: "projectId",
              message: t(
                problem.kind === "noAccess"
                  ? "team-post.taskRefused"
                  : "team-post.taskConflict",
              ),
            },
          ],
        };
      return problem;
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) props.onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{t("team-post.createTaskTitle")}</DialogTitle>
          <DialogDescription>{t("team-post.createTaskText")}</DialogDescription>
        </DialogHeader>
        <StateView
          loading={projects.isLoading || settings.isLoading}
          problem={projects.error ? { kind: "failed" } : null}
          empty={Boolean(projects.data) && !open.length}
          emptyDescription={t("team-post.noProjects")}
        >
          <PortalForm<Values>
            schema={schema}
            defaultValues={{
              projectId,
              columnId:
                delivery?.projectId === projectId ? delivery.columnId : null,
              title: props.post.title,
            }}
            submitKey="team-post.createTaskSubmit"
            className="max-w-none gap-4 py-0 *:not-last:px-6 *:last:justify-end *:last:rounded-b-2xl *:last:border-t *:last:bg-muted/72 *:last:px-6 *:last:py-4"
            footer={() => (
              <DialogClose render={<Button type="button" variant="ghost" />}>
                {t("team-post.cancel")}
              </DialogClose>
            )}
            onSubmit={submit}
          >
            {(form) => (
              <>
                <FormSelect
                  control={form.control}
                  name="projectId"
                  label={t("team-post.taskProject")}
                  options={open.map((project) => ({
                    value: project.id,
                    label: project.name,
                  }))}
                />
                <ColumnField
                  form={form}
                  label={t("team-post.taskColumn")}
                  firstLabel={t("team-post.taskFirstColumn")}
                />
                <Field invalid={Boolean(form.formState.errors.title)}>
                  <FieldLabel htmlFor={id}>
                    {t("team-post.taskTitle")}
                  </FieldLabel>
                  <Input
                    id={id}
                    autoComplete="off"
                    {...form.register("title")}
                  />
                </Field>
              </>
            )}
          </PortalForm>
        </StateView>
      </DialogPopup>
    </Dialog>
  );
}
