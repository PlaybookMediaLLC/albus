import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteTag,
  type DeleteTagRequest,
  type DeleteTagResponse,
} from "../../api/team/delete-tag";
export function useDeleteTag(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<DeleteTagResponse, PortalProblem, DeleteTagRequest>({
    mutationFn: (input) => deleteTag(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listTags",
        ),
      });
    },
  });
}
