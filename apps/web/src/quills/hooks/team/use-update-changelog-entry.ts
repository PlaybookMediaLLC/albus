import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import type { GetChangelogEntryResponse } from "../../api/team/get-changelog-entry";
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
    onSuccess: async (data, input) => {
      // The reply is the full entry, so the editor does not read it again after each save.
      queryClient.setQueriesData<GetChangelogEntryResponse>(
        {
          queryKey: quillsOperationKey(
            input.param.workspaceId,
            viewer,
            "team",
            "getChangelogEntry",
          ),
        },
        (entry) => (entry?.id === data.id ? data : undefined),
      );
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
