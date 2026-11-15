import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteChangelogEntry,
  type DeleteChangelogEntryRequest,
  type DeleteChangelogEntryResponse,
} from "../../api/team/delete-changelog-entry";
export function useDeleteChangelogEntry(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteChangelogEntryResponse,
    PortalProblem,
    DeleteChangelogEntryRequest
  >({
    mutationFn: (input) => deleteChangelogEntry(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listChangelog",
        ),
      });
    },
  });
}
