import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setInboundForwarding,
  type SetInboundForwardingRequest,
  type SetInboundForwardingResponse,
} from "../../api/team/set-inbound-forwarding";
export function useSetInboundForwarding(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetInboundForwardingResponse,
    PortalProblem,
    SetInboundForwardingRequest
  >({
    mutationFn: (input) => setInboundForwarding(input),
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
