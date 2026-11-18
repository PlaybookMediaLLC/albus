import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getKnowledgeSuggestionQuery,
  type GetKnowledgeSuggestionRequest,
} from "../../api/team/get-knowledge-suggestion";
export function useGetKnowledgeSuggestion(
  input: GetKnowledgeSuggestionRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getKnowledgeSuggestionQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.suggestionId),
  });
}
