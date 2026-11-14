import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getWidgetSettingsQuery,
  type GetWidgetSettingsRequest,
} from "../../api/team/get-widget-settings";
export function useGetWidgetSettings(
  input: GetWidgetSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getWidgetSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
