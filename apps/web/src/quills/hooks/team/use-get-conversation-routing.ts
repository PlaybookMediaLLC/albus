import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getConversationRoutingQuery,
  type GetConversationRoutingRequest,
} from "../../api/team/get-conversation-routing";
export function useGetConversationRouting(
  input: GetConversationRoutingRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getConversationRoutingQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
