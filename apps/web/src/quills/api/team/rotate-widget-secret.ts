import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["widget"]["secret"].$post;
export type RotateWidgetSecretRequest = InferRequestType<typeof endpoint>;
export type RotateWidgetSecretResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const rotateWidgetSecretKey = (
  input: RotateWidgetSecretRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "rotateWidgetSecret",
    input,
  );
export async function rotateWidgetSecret(
  input: RotateWidgetSecretRequest,
): Promise<RotateWidgetSecretResponse> {
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
