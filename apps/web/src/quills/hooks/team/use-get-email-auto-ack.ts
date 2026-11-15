import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getEmailAutoAckQuery,
  type GetEmailAutoAckRequest,
} from "../../api/team/get-email-auto-ack";
export function useGetEmailAutoAck(
  input: GetEmailAutoAckRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getEmailAutoAckQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
