import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getScoringFactorsQuery,
  type GetScoringFactorsRequest,
} from "../../api/team/get-scoring-factors";
export function useGetScoringFactors(
  input: GetScoringFactorsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getScoringFactorsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
