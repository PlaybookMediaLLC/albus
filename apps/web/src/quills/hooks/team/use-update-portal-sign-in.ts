import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updatePortalSignIn,
  type UpdatePortalSignInRequest,
  type UpdatePortalSignInResponse,
} from "../../api/team/update-portal-sign-in";
export function useUpdatePortalSignIn(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdatePortalSignInResponse,
    PortalProblem,
    UpdatePortalSignInRequest
  >({
    mutationFn: (input) => updatePortalSignIn(input),
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
