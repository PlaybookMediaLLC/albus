import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  mintWidgetInstallCode,
  type MintWidgetInstallCodeRequest,
  type MintWidgetInstallCodeResponse,
} from "../../api/team/mint-widget-install-code";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useMintWidgetInstallCode() {
  return useMutation<
    MintWidgetInstallCodeResponse,
    PortalProblem,
    MintWidgetInstallCodeRequest
  >({ mutationFn: (input) => mintWidgetInstallCode(input) });
}
