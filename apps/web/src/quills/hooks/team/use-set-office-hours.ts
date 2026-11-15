import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setOfficeHours,
  type SetOfficeHoursRequest,
  type SetOfficeHoursResponse,
} from "../../api/team/set-office-hours";
export function useSetOfficeHours(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetOfficeHoursResponse,
    PortalProblem,
    SetOfficeHoursRequest
  >({
    mutationFn: (input) => setOfficeHours(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getOfficeHours",
        ),
      });
    },
  });
}
