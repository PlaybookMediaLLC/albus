import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getBrandingSettingsQuery,
  type GetBrandingSettingsRequest,
} from "../../api/team/get-branding-settings";
export function useGetBrandingSettings(
  input: GetBrandingSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getBrandingSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
