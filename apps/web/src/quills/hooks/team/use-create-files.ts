import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  createFiles,
  type CreateFilesRequest,
  type CreateFilesResponse,
} from "../../api/team/create-files";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useCreateFiles() {
  return useMutation<CreateFilesResponse, PortalProblem, CreateFilesRequest>({
    mutationFn: (input) => createFiles(input),
  });
}
