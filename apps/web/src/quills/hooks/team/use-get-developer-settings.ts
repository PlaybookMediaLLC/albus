import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getDeveloperSettingsQuery,
  type GetDeveloperSettingsRequest,
} from "../../api/team/get-developer-settings";
export function useGetDeveloperSettings(
  input: GetDeveloperSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getDeveloperSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
