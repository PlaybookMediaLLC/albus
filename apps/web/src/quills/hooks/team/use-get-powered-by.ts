import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getPoweredByQuery,
  type GetPoweredByRequest,
} from "../../api/team/get-powered-by";
export function useGetPoweredBy(input: GetPoweredByRequest, viewer: Viewer) {
  return useQuery({
    ...getPoweredByQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
