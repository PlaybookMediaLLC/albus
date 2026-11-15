import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getAssistantSettingsQuery,
  type GetAssistantSettingsRequest,
} from "../../api/team/get-assistant-settings";
export function useGetAssistantSettings(
  input: GetAssistantSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getAssistantSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
