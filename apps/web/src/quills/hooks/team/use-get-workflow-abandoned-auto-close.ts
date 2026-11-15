import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getWorkflowAbandonedAutoCloseQuery,
  type GetWorkflowAbandonedAutoCloseRequest,
} from "../../api/team/get-workflow-abandoned-auto-close";
export function useGetWorkflowAbandonedAutoClose(
  input: GetWorkflowAbandonedAutoCloseRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getWorkflowAbandonedAutoCloseQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
