import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteChangelogTranslation,
  type DeleteChangelogTranslationRequest,
  type DeleteChangelogTranslationResponse,
} from "../../api/team/delete-changelog-translation";
export function useDeleteChangelogTranslation(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteChangelogTranslationResponse,
    PortalProblem,
    DeleteChangelogTranslationRequest
  >({
    mutationFn: (input) => deleteChangelogTranslation(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listChangelogTranslations",
        ),
      });
    },
  });
}
