import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createTag,
  type CreateTagRequest,
  type CreateTagResponse,
} from "../../api/team/create-tag";
export function useCreateTag(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<CreateTagResponse, PortalProblem, CreateTagRequest>({
    mutationFn: (input) => createTag(input),
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
