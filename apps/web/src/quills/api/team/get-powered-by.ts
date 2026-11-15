import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["powered-by"].$get;
export type GetPoweredByRequest = InferRequestType<typeof endpoint>;
export type GetPoweredByResponse = InferResponseType<typeof endpoint, 200>;
export const getPoweredByKey = (input: GetPoweredByRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "getPoweredBy", input);
export async function getPoweredBy(
  input: GetPoweredByRequest,
): Promise<GetPoweredByResponse> {
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
export const getPoweredByQuery = (input: GetPoweredByRequest, viewer: Viewer) =>
  queryOptions<GetPoweredByResponse, PortalProblem>({
    queryKey: getPoweredByKey(input, viewer),
    queryFn: () => getPoweredBy(input),
  });
