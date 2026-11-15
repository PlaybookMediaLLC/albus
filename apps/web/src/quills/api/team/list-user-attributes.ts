import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["user-attributes"].$get;
export type ListUserAttributesRequest = InferRequestType<typeof endpoint>;
export type ListUserAttributesResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listUserAttributesKey = (
  input: ListUserAttributesRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listUserAttributes",
    input,
  );
export async function listUserAttributes(
  input: ListUserAttributesRequest,
): Promise<ListUserAttributesResponse> {
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
export const listUserAttributesQuery = (
  input: ListUserAttributesRequest,
  viewer: Viewer,
) =>
  queryOptions<ListUserAttributesResponse, PortalProblem>({
    queryKey: listUserAttributesKey(input, viewer),
    queryFn: () => listUserAttributes(input),
  });
