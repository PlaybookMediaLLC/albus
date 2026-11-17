import { useTranslation } from "react-i18next";
import type { GetBoardSettingsResponse } from "../../../api/team/get-board-settings";
import type { PortalProblem } from "../../../core/types";
import { useClearBoardDelivery } from "../../../hooks/team/use-clear-board-delivery";
import { useSetBoardDelivery } from "../../../hooks/team/use-set-board-delivery";
import { useTeamRuntime } from "../../../team/runtime";
import { useGetProjects } from "../../../ui/upstream";
import { DeliveryForm, type DeliveryValues } from "./delivery-form";

export interface DeliverySectionProps {
  workspaceId: string;
  boardId: string;
  delivery: GetBoardSettingsResponse["delivery"];
  statuses: { id: string; name: string }[];
}

/** Saves and removes a board's delivery project and task rule (RFC 0005, phase 2). */
export function DeliverySection(props: DeliverySectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const set = useSetBoardDelivery(team.viewer);
  const clear = useClearBoardDelivery(team.viewer);
  const projects = useGetProjects({ workspaceId: props.workspaceId });
  const param = { workspaceId: props.workspaceId, boardId: props.boardId };
  // A refusal names the project field: no Kaneo task:create there, or an archived project.
  const save = async (json: DeliveryValues): Promise<PortalProblem | void> => {
    try {
      await set.mutateAsync({ param, json });
    } catch (error) {
      const problem = error as PortalProblem;
      if (problem.kind !== "noAccess" && problem.kind !== "conflict")
        return problem;
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
    }
  };
  if (!projects.data) return null;
  return (
    <DeliveryForm
      key={`${props.boardId}:${props.delivery?.projectId ?? ""}`}
      projects={projects.data.filter((project) => !project.archivedAt)}
      delivery={props.delivery}
      statuses={props.statuses}
      onSubmit={save}
      removing={clear.isPending}
      onRemove={() => clear.mutate({ param })}
    />
  );
}
