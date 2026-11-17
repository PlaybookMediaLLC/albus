import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listChangelogTranslationsQuery,
  type ListChangelogTranslationsRequest,
} from "../../api/team/list-changelog-translations";
export function useListChangelogTranslations(
  input: ListChangelogTranslationsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listChangelogTranslationsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.entryId),
  });
}
