import type { PortalProblem } from "../core/types";
import { HttpError } from "../ui/upstream";
import { retryAfterAt } from "../core/retry-after";

// A portal 403 on a record hides the record. A teammate 403 is a denied action.
export async function toPortalProblem(
  response: Response,
  target: "record" | "collection" | "teammate" = "record",
  token = false,
): Promise<PortalProblem> {
  const error = await HttpError.fromResponse(response);
  if (error.status === 401) return { kind: "authRequired" };
  if (error.status === 403) {
    return { kind: target === "record" ? "notFound" : "noAccess" };
  }
  if (error.status === 404) return { kind: token ? "gone" : "notFound" };
  if (error.status === 410) return { kind: "gone" };
  if (error.status === 409) return { kind: "conflict" };
  if (error.status === 429)
    return {
      kind: "rateLimited",
      retryAt: retryAfterAt(response.headers.get("retry-after")),
    };
  if (
    error.status === 422 ||
    (error.status === 400 && error.code === "VALIDATION_ERROR")
  ) {
    // Only a path ID, or a token link's token, is wrong: the link is bad, not a form value.
    if (
      error.issues?.length &&
      error.issues.every(
        (issue) =>
          issue.path.startsWith("params.") ||
          (token && /(?:^|\.)token$/.test(issue.path)),
      )
    )
      return { kind: token ? "gone" : "notFound" };
    return {
      kind: "invalid",
      // The API's issue text is zod's English: keep its code and bounds, and the form translates them.
      issues: error.issues?.map((issue) => ({
        // The API puts the request part first ("body.title"). A form field is "title".
        path: issue.path.replace(/^(?:body|query|params)\./, ""),
        ...(typeof issue.code === "string" && { code: issue.code }),
        ...(typeof issue.origin === "string" && { origin: issue.origin }),
        ...(typeof issue.minimum === "number" && { minimum: issue.minimum }),
        ...(typeof issue.maximum === "number" && { maximum: issue.maximum }),
      })),
    };
  }
  return { kind: "failed" };
}

export function networkPortalProblem(): PortalProblem {
  return { kind: "failed" };
}
