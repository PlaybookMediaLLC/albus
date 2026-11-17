import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setAwayReply,
  type SetAwayReplyRequest,
  type SetAwayReplyResponse,
} from "../../api/team/set-away-reply";
export function useSetAwayReply(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<SetAwayReplyResponse, PortalProblem, SetAwayReplyRequest>({
    mutationFn: (input) => setAwayReply(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getAwayReply",
        ),
      });
    },
  });
}
