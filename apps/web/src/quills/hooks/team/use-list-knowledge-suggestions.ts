import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listKnowledgeSuggestionsQuery,
  type ListKnowledgeSuggestionsRequest,
} from "../../api/team/list-knowledge-suggestions";
export function useListKnowledgeSuggestions(
  input: ListKnowledgeSuggestionsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listKnowledgeSuggestionsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
