import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  wipeWorkspaceData,
  type WipeWorkspaceDataRequest,
  type WipeWorkspaceDataResponse,
} from "../../api/team/wipe-workspace-data";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useWipeWorkspaceData() {
  return useMutation<
    WipeWorkspaceDataResponse,
    PortalProblem,
    WipeWorkspaceDataRequest
  >({ mutationFn: (input) => wipeWorkspaceData(input) });
}
