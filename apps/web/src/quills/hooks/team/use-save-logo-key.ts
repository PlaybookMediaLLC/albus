import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  saveLogoKey,
  type SaveLogoKeyRequest,
  type SaveLogoKeyResponse,
} from "../../api/team/save-logo-key";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useSaveLogoKey() {
  return useMutation<SaveLogoKeyResponse, PortalProblem, SaveLogoKeyRequest>({
    mutationFn: (input) => saveLogoKey(input),
  });
}
