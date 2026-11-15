import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteChangelogCategory,
  type DeleteChangelogCategoryRequest,
  type DeleteChangelogCategoryResponse,
} from "../../api/team/delete-changelog-category";
export function useDeleteChangelogCategory(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteChangelogCategoryResponse,
    PortalProblem,
    DeleteChangelogCategoryRequest
  >({
    mutationFn: (input) => deleteChangelogCategory(input),
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
