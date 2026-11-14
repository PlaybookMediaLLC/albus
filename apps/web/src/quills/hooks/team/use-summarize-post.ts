import { useMutation } from "@tanstack/react-query";
import type { PortalProblem } from "../../core/types";
import {
  summarizePost,
  type SummarizePostRequest,
  type SummarizePostResponse,
} from "../../api/team/summarize-post";
// Generated with --invalidates none: the mutation changes no query that the app caches.
export function useSummarizePost() {
  return useMutation<
    SummarizePostResponse,
    PortalProblem,
    SummarizePostRequest
  >({ mutationFn: (input) => summarizePost(input) });
}
