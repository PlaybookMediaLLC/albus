import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["domains"]["portal"]["verify"]
    .$post;
export type VerifyPortalDomainRequest = InferRequestType<typeof endpoint>;
export type VerifyPortalDomainResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const verifyPortalDomainKey = (
  input: VerifyPortalDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "verifyPortalDomain",
    input,
  );
export async function verifyPortalDomain(
  input: VerifyPortalDomainRequest,
): Promise<VerifyPortalDomainResponse> {
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
