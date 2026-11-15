import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-auto-ack"].$get;
export type GetEmailAutoAckRequest = InferRequestType<typeof endpoint>;
export type GetEmailAutoAckResponse = InferResponseType<typeof endpoint, 200>;
export const getEmailAutoAckKey = (
  input: GetEmailAutoAckRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "getEmailAutoAck", input);
export async function getEmailAutoAck(
  input: GetEmailAutoAckRequest,
): Promise<GetEmailAutoAckResponse> {
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
export const getEmailAutoAckQuery = (
  input: GetEmailAutoAckRequest,
  viewer: Viewer,
) =>
  queryOptions<GetEmailAutoAckResponse, PortalProblem>({
    queryKey: getEmailAutoAckKey(input, viewer),
    queryFn: () => getEmailAutoAck(input),
  });
