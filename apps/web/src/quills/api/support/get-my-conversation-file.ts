import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills-public"][":workspace"]["support"]["conversations"][
    ":conversationId"
  ]["files"][":fileId"].$get;
export type GetMyConversationFileRequest = InferRequestType<typeof endpoint>;
export type GetMyConversationFileResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getMyConversationFileKey = (
  input: GetMyConversationFileRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "support",
    "getMyConversationFile",
    input,
  );
export async function getMyConversationFile(
  input: GetMyConversationFileRequest,
): Promise<GetMyConversationFileResponse> {
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
export const getMyConversationFileQuery = (
  input: GetMyConversationFileRequest,
  viewer: Viewer,
) =>
  queryOptions<GetMyConversationFileResponse, PortalProblem>({
    queryKey: getMyConversationFileKey(input, viewer),
    queryFn: () => getMyConversationFile(input),
  });
