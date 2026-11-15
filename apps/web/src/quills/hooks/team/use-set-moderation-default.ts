import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setModerationDefault,
  type SetModerationDefaultRequest,
  type SetModerationDefaultResponse,
} from "../../api/team/set-moderation-default";
export function useSetModerationDefault(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetModerationDefaultResponse,
    PortalProblem,
    SetModerationDefaultRequest
  >({
    mutationFn: (input) => setModerationDefault(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getPortalSettings",
        ),
      });
    },
  });
}
