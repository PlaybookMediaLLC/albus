import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listChangelogCategoriesQuery,
  type ListChangelogCategoriesRequest,
} from "../../api/team/list-changelog-categories";
export function useListChangelogCategories(
  input: ListChangelogCategoriesRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listChangelogCategoriesQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
