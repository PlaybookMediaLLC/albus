import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getChangelogSettingsQuery,
  type GetChangelogSettingsRequest,
} from "../../api/team/get-changelog-settings";
export function useGetChangelogSettings(
  input: GetChangelogSettingsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getChangelogSettingsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
