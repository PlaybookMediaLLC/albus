import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import { {{NAME}}, type {{PASCAL}}Request, type {{PASCAL}}Response } from "../../api/{{AREA_RAW}}/{{FILE}}";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function use{{PASCAL}}() {
  return useMutation<{{PASCAL}}Response, PortalProblem, {{PASCAL}}Request>({ mutationFn: (input) => {{NAME}}(input) });
}
