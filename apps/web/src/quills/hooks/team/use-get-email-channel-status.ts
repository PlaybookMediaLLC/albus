import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getEmailChannelStatusQuery,
  type GetEmailChannelStatusRequest,
} from "../../api/team/get-email-channel-status";
export function useGetEmailChannelStatus(
  input: GetEmailChannelStatusRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getEmailChannelStatusQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
