import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["sla-policies"]["options"].$get;
export type ListSlaPolicyOptionsRequest = InferRequestType<typeof endpoint>;
export type ListSlaPolicyOptionsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listSlaPolicyOptionsKey = (
  input: ListSlaPolicyOptionsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listSlaPolicyOptions",
    input,
  );
export async function listSlaPolicyOptions(
  input: ListSlaPolicyOptionsRequest,
): Promise<ListSlaPolicyOptionsResponse> {
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
export const listSlaPolicyOptionsQuery = (
  input: ListSlaPolicyOptionsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListSlaPolicyOptionsResponse, PortalProblem>({
    queryKey: listSlaPolicyOptionsKey(input, viewer),
    queryFn: () => listSlaPolicyOptions(input),
  });
