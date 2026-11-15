import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["widget"]["install-code"].$post;
export type MintWidgetInstallCodeRequest = InferRequestType<typeof endpoint>;
export type MintWidgetInstallCodeResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const mintWidgetInstallCodeKey = (
  input: MintWidgetInstallCodeRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "mintWidgetInstallCode",
    input,
  );
export async function mintWidgetInstallCode(
  input: MintWidgetInstallCodeRequest,
): Promise<MintWidgetInstallCodeResponse> {
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
