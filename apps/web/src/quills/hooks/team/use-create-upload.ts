import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  createUpload,
  type CreateUploadRequest,
  type CreateUploadResponse,
} from "../../api/team/create-upload";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useCreateUpload() {
  return useMutation<CreateUploadResponse, PortalProblem, CreateUploadRequest>({
    mutationFn: (input) => createUpload(input),
  });
}
