import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listConversationTagUsageQuery,
  type ListConversationTagUsageRequest,
} from "../../api/team/list-conversation-tag-usage";
export function useListConversationTagUsage(
  input: ListConversationTagUsageRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listConversationTagUsageQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
