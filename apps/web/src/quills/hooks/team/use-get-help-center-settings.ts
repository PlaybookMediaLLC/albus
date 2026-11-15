import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getHelpCenterSettingsQuery,
  type GetHelpCenterSettingsRequest,
} from "../../api/team/get-help-center-settings";
export function useGetHelpCenterSettings(
  input: GetHelpCenterSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getHelpCenterSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
