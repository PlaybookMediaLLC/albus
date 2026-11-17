import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  declinePortalWidgetLink,
  type DeclinePortalWidgetLinkRequest,
  type DeclinePortalWidgetLinkResponse,
} from "../../api/portal/decline-portal-widget-link";
export function useDeclinePortalWidgetLink(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeclinePortalWidgetLinkResponse,
    PortalProblem,
    DeclinePortalWidgetLinkRequest
  >({
    mutationFn: (input) => declinePortalWidgetLink(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "portal",
          "getPortalWidgetLink",
        ),
      });
    },
  });
}
