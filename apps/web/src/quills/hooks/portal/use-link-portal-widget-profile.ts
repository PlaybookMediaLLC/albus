import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  linkPortalWidgetProfile,
  type LinkPortalWidgetProfileRequest,
  type LinkPortalWidgetProfileResponse,
} from "../../api/portal/link-portal-widget-profile";
export function useLinkPortalWidgetProfile(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    LinkPortalWidgetProfileResponse,
    PortalProblem,
    LinkPortalWidgetProfileRequest
  >({
    mutationFn: (input) => linkPortalWidgetProfile(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "portal",
          "getPortalWidgetLink",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "feedback",
          "listPortalMyFeedback",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "support",
          "listMyConversations",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "support",
          "getMyTickets",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "portal",
          "getCustomerProfile",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "portal",
          "evaluateMyPortalAccess",
        ),
      });
    },
  });
}
