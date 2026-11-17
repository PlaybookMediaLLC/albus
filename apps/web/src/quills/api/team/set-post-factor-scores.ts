import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["factor-scores"].$put;
export type SetPostFactorScoresRequest = InferRequestType<typeof endpoint>;
export type SetPostFactorScoresResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setPostFactorScoresKey = (
  input: SetPostFactorScoresRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setPostFactorScores",
    input,
  );
export async function setPostFactorScores(
  input: SetPostFactorScoresRequest,
): Promise<SetPostFactorScoresResponse> {
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
