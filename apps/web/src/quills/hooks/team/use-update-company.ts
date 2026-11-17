import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateCompany,
  type UpdateCompanyRequest,
  type UpdateCompanyResponse,
} from "../../api/team/update-company";
export function useUpdateCompany(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCompanyResponse,
    PortalProblem,
    UpdateCompanyRequest
  >({
    mutationFn: (input) => updateCompany(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getUserCompany",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listPosts",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getPostDemand",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getRevenueAtRisk",
        ),
      });
    },
  });
}
