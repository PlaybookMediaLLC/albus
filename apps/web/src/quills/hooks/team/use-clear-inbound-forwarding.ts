import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  clearInboundForwarding,
  type ClearInboundForwardingRequest,
  type ClearInboundForwardingResponse,
} from "../../api/team/clear-inbound-forwarding";
export function useClearInboundForwarding(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    ClearInboundForwardingResponse,
    PortalProblem,
    ClearInboundForwardingRequest
  >({
    mutationFn: (input) => clearInboundForwarding(input),
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
