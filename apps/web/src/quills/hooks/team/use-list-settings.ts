import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listSettingsQuery,
  type ListSettingsRequest,
} from "../../api/team/list-settings";
export function useListSettings(input: ListSettingsRequest, viewer: Viewer) {
  return useQuery({
    ...listSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
