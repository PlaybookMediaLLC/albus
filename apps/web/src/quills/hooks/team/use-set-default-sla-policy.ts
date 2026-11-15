import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setDefaultSlaPolicy,
  type SetDefaultSlaPolicyRequest,
  type SetDefaultSlaPolicyResponse,
} from "../../api/team/set-default-sla-policy";
export function useSetDefaultSlaPolicy(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetDefaultSlaPolicyResponse,
    PortalProblem,
    SetDefaultSlaPolicyRequest
  >({
    mutationFn: (input) => setDefaultSlaPolicy(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getDefaultSlaPolicy",
        ),
      });
    },
  });
}
