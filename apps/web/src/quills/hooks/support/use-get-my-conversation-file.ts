import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getMyConversationFileQuery,
  type GetMyConversationFileRequest,
} from "../../api/support/get-my-conversation-file";
export function useGetMyConversationFile(
  input: GetMyConversationFileRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getMyConversationFileQuery(input, viewer),
    enabled: Boolean(
      input.param.workspace && input.param.conversationId && input.param.fileId,
    ),
  });
}
