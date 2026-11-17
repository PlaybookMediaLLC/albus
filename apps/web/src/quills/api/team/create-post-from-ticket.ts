import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["tickets"][":ticketId"]["posts"].$post;
export type CreatePostFromTicketRequest = InferRequestType<typeof endpoint>;
export type CreatePostFromTicketResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createPostFromTicketKey = (
  input: CreatePostFromTicketRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createPostFromTicket",
    input,
  );
export async function createPostFromTicket(
  input: CreatePostFromTicketRequest,
): Promise<CreatePostFromTicketResponse> {
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
