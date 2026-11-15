import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createSendingAddress,
  type CreateSendingAddressRequest,
  type CreateSendingAddressResponse,
} from "../../api/team/create-sending-address";
export function useCreateSendingAddress(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateSendingAddressResponse,
    PortalProblem,
    CreateSendingAddressRequest
  >({
    mutationFn: (input) => createSendingAddress(input),
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
