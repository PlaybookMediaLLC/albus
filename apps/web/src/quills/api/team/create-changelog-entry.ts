import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["changelog"].$post;
export type CreateChangelogEntryRequest = InferRequestType<typeof endpoint>;
export type CreateChangelogEntryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createChangelogEntryKey = (
  input: CreateChangelogEntryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createChangelogEntry",
    input,
  );
export async function createChangelogEntry(
  input: CreateChangelogEntryRequest,
): Promise<CreateChangelogEntryResponse> {
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
