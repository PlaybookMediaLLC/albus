import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["users"][":principalId"]["company"].$delete;
export type RemoveUserCompanyRequest = InferRequestType<typeof endpoint>;
export type RemoveUserCompanyResponse = InferResponseType<typeof endpoint, 200>;
export const removeUserCompanyKey = (
  input: RemoveUserCompanyRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "removeUserCompany",
    input,
  );
export async function removeUserCompany(
  input: RemoveUserCompanyRequest,
): Promise<RemoveUserCompanyResponse> {
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
