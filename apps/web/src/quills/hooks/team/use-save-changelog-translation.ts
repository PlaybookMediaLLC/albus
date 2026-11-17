import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  saveChangelogTranslation,
  type SaveChangelogTranslationRequest,
  type SaveChangelogTranslationResponse,
} from "../../api/team/save-changelog-translation";
export function useSaveChangelogTranslation(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SaveChangelogTranslationResponse,
    PortalProblem,
    SaveChangelogTranslationRequest
  >({
    mutationFn: (input) => saveChangelogTranslation(input),
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
