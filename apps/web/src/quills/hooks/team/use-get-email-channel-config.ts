import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getEmailChannelConfigQuery,
  type GetEmailChannelConfigRequest,
} from "../../api/team/get-email-channel-config";
export function useGetEmailChannelConfig(
  input: GetEmailChannelConfigRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getEmailChannelConfigQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
