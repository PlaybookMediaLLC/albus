import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createChangelogEntry,
  type CreateChangelogEntryRequest,
  type CreateChangelogEntryResponse,
} from "../../api/team/create-changelog-entry";
export function useCreateChangelogEntry(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateChangelogEntryResponse,
    PortalProblem,
    CreateChangelogEntryRequest
  >({
    mutationFn: (input) => createChangelogEntry(input),
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
