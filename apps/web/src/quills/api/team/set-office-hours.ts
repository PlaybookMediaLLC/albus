import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["office-hours"].$put;
export type SetOfficeHoursRequest = InferRequestType<typeof endpoint>;
export type SetOfficeHoursResponse = InferResponseType<typeof endpoint, 200>;
export const setOfficeHoursKey = (
  input: SetOfficeHoursRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setOfficeHours", input);
export async function setOfficeHours(
  input: SetOfficeHoursRequest,
): Promise<SetOfficeHoursResponse> {
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
