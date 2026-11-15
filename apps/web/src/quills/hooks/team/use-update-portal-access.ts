import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updatePortalAccess,
  type UpdatePortalAccessRequest,
  type UpdatePortalAccessResponse,
} from "../../api/team/update-portal-access";
export function useUpdatePortalAccess(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdatePortalAccessResponse,
    PortalProblem,
    UpdatePortalAccessRequest
  >({
    mutationFn: (input) => updatePortalAccess(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getPortalSettings",
        ),
      });
    },
  });
}
