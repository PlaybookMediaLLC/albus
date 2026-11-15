import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"]["categories"][":categoryId"]
    .$delete;
export type DeleteChangelogCategoryRequest = InferRequestType<typeof endpoint>;
export type DeleteChangelogCategoryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteChangelogCategoryKey = (
  input: DeleteChangelogCategoryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "deleteChangelogCategory",
    input,
  );
export async function deleteChangelogCategory(
  input: DeleteChangelogCategoryRequest,
): Promise<DeleteChangelogCategoryResponse> {
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
