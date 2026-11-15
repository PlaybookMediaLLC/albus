import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"][":entryId"].$patch;
export type UpdateChangelogEntryRequest = InferRequestType<typeof endpoint>;
export type UpdateChangelogEntryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateChangelogEntryKey = (
  input: UpdateChangelogEntryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateChangelogEntry",
    input,
  );
export async function updateChangelogEntry(
  input: UpdateChangelogEntryRequest,
): Promise<UpdateChangelogEntryResponse> {
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
