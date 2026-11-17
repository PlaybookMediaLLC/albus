import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["feedback"]["scoring-factors"].$get;
export type GetScoringFactorsRequest = InferRequestType<typeof endpoint>;
export type GetScoringFactorsResponse = InferResponseType<typeof endpoint, 200>;
export const getScoringFactorsKey = (
  input: GetScoringFactorsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getScoringFactors",
    input,
  );
export async function getScoringFactors(
  input: GetScoringFactorsRequest,
): Promise<GetScoringFactorsResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "teammate", false);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
export const getScoringFactorsQuery = (
  input: GetScoringFactorsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetScoringFactorsResponse, PortalProblem>({
    queryKey: getScoringFactorsKey(input, viewer),
    queryFn: () => getScoringFactors(input),
  });
