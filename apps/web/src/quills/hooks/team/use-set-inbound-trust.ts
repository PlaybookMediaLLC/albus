import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setInboundTrust,
  type SetInboundTrustRequest,
  type SetInboundTrustResponse,
} from "../../api/team/set-inbound-trust";
export function useSetInboundTrust(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetInboundTrustResponse,
    PortalProblem,
    SetInboundTrustRequest
  >({
    mutationFn: (input) => setInboundTrust(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getEmailChannelConfig",
        ),
      });
    },
  });
}
