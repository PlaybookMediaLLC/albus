import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["default-sla-policy"].$get;
export type GetDefaultSlaPolicyRequest = InferRequestType<typeof endpoint>;
export type GetDefaultSlaPolicyResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getDefaultSlaPolicyKey = (
  input: GetDefaultSlaPolicyRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getDefaultSlaPolicy",
    input,
  );
export async function getDefaultSlaPolicy(
  input: GetDefaultSlaPolicyRequest,
): Promise<GetDefaultSlaPolicyResponse> {
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
export const getDefaultSlaPolicyQuery = (
  input: GetDefaultSlaPolicyRequest,
  viewer: Viewer,
) =>
  queryOptions<GetDefaultSlaPolicyResponse, PortalProblem>({
    queryKey: getDefaultSlaPolicyKey(input, viewer),
    queryFn: () => getDefaultSlaPolicy(input),
  });
