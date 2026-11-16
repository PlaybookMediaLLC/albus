import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["files"][":fileId"].$get;
export type GetFileRequest = InferRequestType<typeof endpoint>;
export type GetFileResponse = InferResponseType<typeof endpoint, 200>;
export const getFileKey = (input: GetFileRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "getFile", input);
export async function getFile(input: GetFileRequest): Promise<GetFileResponse> {
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
export const getFileQuery = (input: GetFileRequest, viewer: Viewer) =>
  queryOptions<GetFileResponse, PortalProblem>({
    queryKey: getFileKey(input, viewer),
    queryFn: () => getFile(input),
  });
