import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["help-center"]["settings"]["locales"]
    .$delete;
export type DisableHelpCenterLocaleRequest = InferRequestType<typeof endpoint>;
export type DisableHelpCenterLocaleResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const disableHelpCenterLocaleKey = (
  input: DisableHelpCenterLocaleRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "disableHelpCenterLocale",
    input,
  );
export async function disableHelpCenterLocale(
  input: DisableHelpCenterLocaleRequest,
): Promise<DisableHelpCenterLocaleResponse> {
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
