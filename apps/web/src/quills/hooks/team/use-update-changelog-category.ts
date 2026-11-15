import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateChangelogCategory,
  type UpdateChangelogCategoryRequest,
  type UpdateChangelogCategoryResponse,
} from "../../api/team/update-changelog-category";
export function useUpdateChangelogCategory(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateChangelogCategoryResponse,
    PortalProblem,
    UpdateChangelogCategoryRequest
  >({
    mutationFn: (input) => updateChangelogCategory(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listChangelogCategories",
        ),
      });
    },
  });
}
