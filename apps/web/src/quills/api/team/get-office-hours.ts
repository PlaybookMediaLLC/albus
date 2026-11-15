import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["office-hours"].$get;
export type GetOfficeHoursRequest = InferRequestType<typeof endpoint>;
export type GetOfficeHoursResponse = InferResponseType<typeof endpoint, 200>;
export const getOfficeHoursKey = (
  input: GetOfficeHoursRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "getOfficeHours", input);
export async function getOfficeHours(
  input: GetOfficeHoursRequest,
): Promise<GetOfficeHoursResponse> {
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
export const getOfficeHoursQuery = (
  input: GetOfficeHoursRequest,
  viewer: Viewer,
) =>
  queryOptions<GetOfficeHoursResponse, PortalProblem>({
    queryKey: getOfficeHoursKey(input, viewer),
    queryFn: () => getOfficeHours(input),
  });
