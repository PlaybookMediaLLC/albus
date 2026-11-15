import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setPortalDomain,
  type SetPortalDomainRequest,
  type SetPortalDomainResponse,
} from "../../api/team/set-portal-domain";
export function useSetPortalDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetPortalDomainResponse,
    PortalProblem,
    SetPortalDomainRequest
  >({
    mutationFn: (input) => setPortalDomain(input),
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
