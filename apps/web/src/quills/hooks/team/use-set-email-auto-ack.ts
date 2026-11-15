import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setEmailAutoAck,
  type SetEmailAutoAckRequest,
  type SetEmailAutoAckResponse,
} from "../../api/team/set-email-auto-ack";
export function useSetEmailAutoAck(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetEmailAutoAckResponse,
    PortalProblem,
    SetEmailAutoAckRequest
  >({
    mutationFn: (input) => setEmailAutoAck(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getEmailAutoAck",
        ),
      });
    },
  });
}
