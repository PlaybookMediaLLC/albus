import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getAwayReplyQuery,
  type GetAwayReplyRequest,
} from "../../api/team/get-away-reply";
export function useGetAwayReply(input: GetAwayReplyRequest, viewer: Viewer) {
  return useQuery({
    ...getAwayReplyQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
