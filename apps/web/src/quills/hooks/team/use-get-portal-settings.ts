import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getPortalSettingsQuery,
  type GetPortalSettingsRequest,
} from "../../api/team/get-portal-settings";
export function useGetPortalSettings(
  input: GetPortalSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getPortalSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
