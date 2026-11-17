import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  previewPostUpdate,
  type PreviewPostUpdateRequest,
  type PreviewPostUpdateResponse,
} from "../../api/team/preview-post-update";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function usePreviewPostUpdate() {
  return useMutation<
    PreviewPostUpdateResponse,
    PortalProblem,
    PreviewPostUpdateRequest
  >({ mutationFn: (input) => previewPostUpdate(input) });
}
