import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["moderation"]["pending"].$get;
export type ListPendingModerationRequest = InferRequestType<typeof endpoint>;
export type ListPendingModerationResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listPendingModerationKey = (
  input: ListPendingModerationRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listPendingModeration",
    input,
  );
export async function listPendingModeration(
  input: ListPendingModerationRequest,
): Promise<ListPendingModerationResponse> {
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
export const listPendingModerationQuery = (
  input: ListPendingModerationRequest,
  viewer: Viewer,
) =>
  queryOptions<ListPendingModerationResponse, PortalProblem>({
    queryKey: listPendingModerationKey(input, viewer),
    queryFn: () => listPendingModeration(input),
  });
