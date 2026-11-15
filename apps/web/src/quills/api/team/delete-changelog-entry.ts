import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"][":entryId"].$delete;
export type DeleteChangelogEntryRequest = InferRequestType<typeof endpoint>;
export type DeleteChangelogEntryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteChangelogEntryKey = (
  input: DeleteChangelogEntryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "deleteChangelogEntry",
    input,
  );
export async function deleteChangelogEntry(
  input: DeleteChangelogEntryRequest,
): Promise<DeleteChangelogEntryResponse> {
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
