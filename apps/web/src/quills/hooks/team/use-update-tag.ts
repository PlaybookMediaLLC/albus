import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateTag,
  type UpdateTagRequest,
  type UpdateTagResponse,
} from "../../api/team/update-tag";
export function useUpdateTag(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<UpdateTagResponse, PortalProblem, UpdateTagRequest>({
    mutationFn: (input) => updateTag(input),
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
