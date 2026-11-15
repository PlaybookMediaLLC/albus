import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"]["categories"].$post;
export type CreateChangelogCategoryRequest = InferRequestType<typeof endpoint>;
export type CreateChangelogCategoryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createChangelogCategoryKey = (
  input: CreateChangelogCategoryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createChangelogCategory",
    input,
  );
export async function createChangelogCategory(
  input: CreateChangelogCategoryRequest,
): Promise<CreateChangelogCategoryResponse> {
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
