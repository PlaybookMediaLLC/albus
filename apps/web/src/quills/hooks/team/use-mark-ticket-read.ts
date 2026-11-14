import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  markTicketRead,
  type MarkTicketReadRequest,
  type MarkTicketReadResponse,
} from "../../api/team/mark-ticket-read";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useMarkTicketRead() {
  return useMutation<
    MarkTicketReadResponse,
    PortalProblem,
    MarkTicketReadRequest
  >({ mutationFn: (input) => markTicketRead(input) });
}
