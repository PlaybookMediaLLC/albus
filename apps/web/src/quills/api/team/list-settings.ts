import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"].$get;
export type ListSettingsRequest = InferRequestType<typeof endpoint>;
export type ListSettingsResponse = InferResponseType<typeof endpoint, 200>;
export const listSettingsKey = (input: ListSettingsRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listSettings", input);
export async function listSettings(
  input: ListSettingsRequest,
): Promise<ListSettingsResponse> {
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
export const listSettingsQuery = (input: ListSettingsRequest, viewer: Viewer) =>
  queryOptions<ListSettingsResponse, PortalProblem>({
    queryKey: listSettingsKey(input, viewer),
    queryFn: () => listSettings(input),
  });
