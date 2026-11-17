import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills-public"][":workspace"]["support"]["conversations"][
    ":conversationId"
  ]["messages"][":messageId"]["feedback-card"].$put;
export type ConfirmFeedbackCardRequest = InferRequestType<typeof endpoint>;
export type ConfirmFeedbackCardResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const confirmFeedbackCardKey = (
  input: ConfirmFeedbackCardRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "support",
    "confirmFeedbackCard",
    input,
  );
export async function confirmFeedbackCard(
  input: ConfirmFeedbackCardRequest,
): Promise<ConfirmFeedbackCardResponse> {
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
