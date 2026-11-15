import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  createAdminAssistantTransform,
  type CreateAdminAssistantTransformRequest,
  type CreateAdminAssistantTransformResponse,
} from "../../api/team/create-admin-assistant-transform";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useCreateAdminAssistantTransform() {
  return useMutation<
    CreateAdminAssistantTransformResponse,
    PortalProblem,
    CreateAdminAssistantTransformRequest
  >({ mutationFn: (input) => createAdminAssistantTransform(input) });
}
