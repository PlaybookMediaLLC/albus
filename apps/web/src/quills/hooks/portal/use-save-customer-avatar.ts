import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  saveCustomerAvatar,
  type SaveCustomerAvatarRequest,
  type SaveCustomerAvatarResponse,
} from "../../api/portal/save-customer-avatar";
export function useSaveCustomerAvatar(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SaveCustomerAvatarResponse,
    PortalProblem,
    SaveCustomerAvatarRequest
  >({
    mutationFn: (input) => saveCustomerAvatar(input),
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
