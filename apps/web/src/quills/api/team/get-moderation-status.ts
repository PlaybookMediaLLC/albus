import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["moderation"]["status"].$get;
export type GetModerationStatusRequest = InferRequestType<typeof endpoint>;
export type GetModerationStatusResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getModerationStatusKey = (
  input: GetModerationStatusRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getModerationStatus",
    input,
  );
export async function getModerationStatus(
  input: GetModerationStatusRequest,
): Promise<GetModerationStatusResponse> {
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
export const getModerationStatusQuery = (
  input: GetModerationStatusRequest,
  viewer: Viewer,
) =>
  queryOptions<GetModerationStatusResponse, PortalProblem>({
    queryKey: getModerationStatusKey(input, viewer),
    queryFn: () => getModerationStatus(input),
  });
