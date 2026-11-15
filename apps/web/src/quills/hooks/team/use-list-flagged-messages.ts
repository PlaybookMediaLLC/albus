import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listFlaggedMessagesQuery,
  type ListFlaggedMessagesRequest,
} from "../../api/team/list-flagged-messages";
export function useListFlaggedMessages(
  input: ListFlaggedMessagesRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listFlaggedMessagesQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
