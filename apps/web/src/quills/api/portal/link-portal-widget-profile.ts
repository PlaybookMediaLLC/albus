import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills-public"][":workspace"]["portal"]["widget-link"].$post;
export type LinkPortalWidgetProfileRequest = InferRequestType<typeof endpoint>;
export type LinkPortalWidgetProfileResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const linkPortalWidgetProfileKey = (
  input: LinkPortalWidgetProfileRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "portal",
    "linkPortalWidgetProfile",
    input,
  );
export async function linkPortalWidgetProfile(
  input: LinkPortalWidgetProfileRequest,
): Promise<LinkPortalWidgetProfileResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "record", false);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
