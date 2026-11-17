import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { GetBoardSettingsResponse } from "../../../api/team/get-board-settings";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Button } from "../../../ui/upstream";
import { ColumnField } from "../../../team/post-tasks/column-field";

const PRIORITIES = ["no-priority", "low", "medium", "high", "urgent"] as const;
const priorityKeys = {
  "no-priority": "task-sync.delivery.priorities.no-priority",
  low: "task-sync.delivery.priorities.low",
  medium: "task-sync.delivery.priorities.medium",
  high: "task-sync.delivery.priorities.high",
  urgent: "task-sync.delivery.priorities.urgent",
} as const;
const schema = z.object({
  projectId: z.string().min(1),
  columnId: z.string().nullable(),
  priority: z.enum(PRIORITIES),
  triggerStatusId: z.string().nullable(),
});
export type DeliveryValues = z.infer<typeof schema>;

export interface DeliveryFormProps {
  /** Kaneo's open projects of the teammate. */
  projects: { id: string; name: string }[];
  delivery: GetBoardSettingsResponse["delivery"];
  statuses: { id: string; name: string }[];
  onSubmit: (values: DeliveryValues) => Promise<PortalProblem | void>;
  /** Removes the delivery project and the rule. */
  onRemove: () => void;
  removing?: boolean;
}

/**
 * A board's delivery project and task rule (RFC 0005, decisions 1, 4 and 5). The rule is off until a
 * teammate picks a status. The delivery project never changes who sees the board.
 */
export function DeliveryForm(props: DeliveryFormProps) {
  const { t } = useTranslation("quills");
  return (
    <section aria-labelledby="team-boards-delivery" className="grid gap-2">
      <h2 id="team-boards-delivery" className="text-sm font-semibold">
        {t("task-sync.delivery.title")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("task-sync.delivery.note")}
      </p>
      <PortalForm<DeliveryValues>
        schema={schema}
        defaultValues={
          props.delivery ?? {
            projectId: props.projects[0]?.id ?? "",
            columnId: null,
            priority: "medium",
            triggerStatusId: null,
          }
        }
        submitKey="task-sync.delivery.save"
        onSubmit={props.onSubmit}
        footer={() =>
          props.delivery ? (
            <Button
              type="button"
              variant="ghost"
              loading={props.removing}
              onClick={props.onRemove}
            >
              {t("task-sync.delivery.remove")}
            </Button>
          ) : null
        }
      >
        {(form) => (
          <>
            <FormSelect
              control={form.control}
              name="projectId"
              label={t("task-sync.delivery.project")}
              options={props.projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
            />
            <ColumnField
              form={form}
              label={t("task-sync.delivery.column")}
              firstLabel={t("task-sync.delivery.firstColumn")}
            />
            <FormSelect
              control={form.control}
              name="priority"
              label={t("task-sync.delivery.priority")}
              options={PRIORITIES.map((priority) => ({
                value: priority,
                label: t(priorityKeys[priority]),
              }))}
            />
            <FormSelect
              control={form.control}
              name="triggerStatusId"
              label={t("task-sync.delivery.trigger")}
              options={[
                { value: null, label: t("task-sync.delivery.off") },
                ...props.statuses.map((status) => ({
                  value: status.id,
                  label: status.name,
                })),
              ]}
            />
          </>
        )}
      </PortalForm>
    </section>
  );
}
