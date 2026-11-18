import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteCustomerAvatar,
  type DeleteCustomerAvatarRequest,
  type DeleteCustomerAvatarResponse,
} from "../../api/portal/delete-customer-avatar";
export function useDeleteCustomerAvatar(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteCustomerAvatarResponse,
    PortalProblem,
    DeleteCustomerAvatarRequest
  >({
    mutationFn: (input) => deleteCustomerAvatar(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "portal",
          "getCustomerProfile",
        ),
      });
    },
  });
}
