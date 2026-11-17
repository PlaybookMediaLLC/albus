import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["companies"][":companyId"].$put;
export type UpdateCompanyRequest = InferRequestType<typeof endpoint>;
export type UpdateCompanyResponse = InferResponseType<typeof endpoint, 200>;
export const updateCompanyKey = (input: UpdateCompanyRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "updateCompany", input);
export async function updateCompany(
  input: UpdateCompanyRequest,
): Promise<UpdateCompanyResponse> {
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
