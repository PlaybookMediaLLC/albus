import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  deleteLogo,
  type DeleteLogoRequest,
  type DeleteLogoResponse,
} from "../../api/team/delete-logo";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useDeleteLogo() {
  return useMutation<DeleteLogoResponse, PortalProblem, DeleteLogoRequest>({
    mutationFn: (input) => deleteLogo(input),
  });
}
