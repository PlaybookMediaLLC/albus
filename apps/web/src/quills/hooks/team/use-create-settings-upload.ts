import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  createSettingsUpload,
  type CreateSettingsUploadRequest,
  type CreateSettingsUploadResponse,
} from "../../api/team/create-settings-upload";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useCreateSettingsUpload() {
  return useMutation<
    CreateSettingsUploadResponse,
    PortalProblem,
    CreateSettingsUploadRequest
  >({ mutationFn: (input) => createSettingsUpload(input) });
}
