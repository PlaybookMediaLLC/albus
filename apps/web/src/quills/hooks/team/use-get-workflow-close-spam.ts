import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getWorkflowCloseSpamQuery,
  type GetWorkflowCloseSpamRequest,
} from "../../api/team/get-workflow-close-spam";
export function useGetWorkflowCloseSpam(
  input: GetWorkflowCloseSpamRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getWorkflowCloseSpamQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
