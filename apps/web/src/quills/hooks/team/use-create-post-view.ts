import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createPostView,
  type CreatePostViewRequest,
  type CreatePostViewResponse,
} from "../../api/team/create-post-view";
export function useCreatePostView(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    CreatePostViewResponse,
    PortalProblem,
    CreatePostViewRequest
  >({
    mutationFn: (input) => createPostView(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listPostViews",
        ),
      });
    },
  });
}
