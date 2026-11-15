import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteChannelAccount,
  type DeleteChannelAccountRequest,
  type DeleteChannelAccountResponse,
} from "../../api/team/delete-channel-account";
export function useDeleteChannelAccount(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteChannelAccountResponse,
    PortalProblem,
    DeleteChannelAccountRequest
  >({
    mutationFn: (input) => deleteChannelAccount(input),
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
