import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  setAgentAvailability,
  type SetAgentAvailabilityRequest,
  type SetAgentAvailabilityResponse,
} from "../../api/team/set-agent-availability";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useSetAgentAvailability() {
  return useMutation<
    SetAgentAvailabilityResponse,
    PortalProblem,
    SetAgentAvailabilityRequest
  >({ mutationFn: (input) => setAgentAvailability(input) });
}
