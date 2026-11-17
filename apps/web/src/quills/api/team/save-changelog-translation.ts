import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"][":entryId"]["translations"]
    .$put;
export type SaveChangelogTranslationRequest = InferRequestType<typeof endpoint>;
export type SaveChangelogTranslationResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const saveChangelogTranslationKey = (
  input: SaveChangelogTranslationRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "saveChangelogTranslation",
    input,
  );
export async function saveChangelogTranslation(
  input: SaveChangelogTranslationRequest,
): Promise<SaveChangelogTranslationResponse> {
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
