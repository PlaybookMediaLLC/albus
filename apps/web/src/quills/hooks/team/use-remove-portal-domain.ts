import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  removePortalDomain,
  type RemovePortalDomainRequest,
  type RemovePortalDomainResponse,
} from "../../api/team/remove-portal-domain";
export function useRemovePortalDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    RemovePortalDomainResponse,
    PortalProblem,
    RemovePortalDomainRequest
  >({
    mutationFn: (input) => removePortalDomain(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listCustomDomains",
        ),
      });
    },
  });
}
