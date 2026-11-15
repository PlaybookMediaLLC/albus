import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createChangelogCategory,
  type CreateChangelogCategoryRequest,
  type CreateChangelogCategoryResponse,
} from "../../api/team/create-changelog-category";
export function useCreateChangelogCategory(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateChangelogCategoryResponse,
    PortalProblem,
    CreateChangelogCategoryRequest
  >({
    mutationFn: (input) => createChangelogCategory(input),
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
