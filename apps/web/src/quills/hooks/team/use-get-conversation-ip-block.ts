import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getConversationIpBlockQuery,
  type GetConversationIpBlockRequest,
} from "../../api/team/get-conversation-ip-block";
export function useGetConversationIpBlock(
  input: GetConversationIpBlockRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getConversationIpBlockQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.conversationId),
  });
}
