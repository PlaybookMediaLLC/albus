import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["help-center"]["settings"]["locales"].$put;
export type EnableHelpCenterLocaleRequest = InferRequestType<typeof endpoint>;
export type EnableHelpCenterLocaleResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const enableHelpCenterLocaleKey = (
  input: EnableHelpCenterLocaleRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "enableHelpCenterLocale",
    input,
  );
export async function enableHelpCenterLocale(
  input: EnableHelpCenterLocaleRequest,
): Promise<EnableHelpCenterLocaleResponse> {
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
