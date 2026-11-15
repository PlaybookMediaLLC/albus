import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setPoweredBy,
  type SetPoweredByRequest,
  type SetPoweredByResponse,
} from "../../api/team/set-powered-by";
export function useSetPoweredBy(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<SetPoweredByResponse, PortalProblem, SetPoweredByRequest>({
    mutationFn: (input) => setPoweredBy(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getPoweredBy",
        ),
      });
    },
  });
}
