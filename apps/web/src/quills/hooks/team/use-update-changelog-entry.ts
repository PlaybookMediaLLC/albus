import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateChangelogEntry,
  type UpdateChangelogEntryRequest,
  type UpdateChangelogEntryResponse,
} from "../../api/team/update-changelog-entry";
export function useUpdateChangelogEntry(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateChangelogEntryResponse,
    PortalProblem,
    UpdateChangelogEntryRequest
  >({
    mutationFn: (input) => updateChangelogEntry(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listChangelog",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getChangelogEntry",
        ),
      });
    },
  });
}
