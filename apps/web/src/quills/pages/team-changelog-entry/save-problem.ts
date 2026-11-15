import type { PortalProblem, PortalProblemKind } from "../../core/types";

const keys: Partial<Record<PortalProblemKind, string>> = {
  conflict: "team-changelog.editor.problem.conflict",
  invalid: "team-changelog.editor.problem.invalid",
  noAccess: "team-changelog.editor.problem.noAccess",
  notFound: "team-changelog.editor.problem.notFound",
  rateLimited: "team-changelog.editor.problem.rateLimited",
};

/** The toast of a failed save: the message key of the API problem and the first API issue. */
export function saveProblem(error: unknown) {
  const problem = (error ?? {}) as Partial<PortalProblem>;
  return {
    key:
      (problem.kind && keys[problem.kind]) ||
      "team-changelog.editor.saveFailed",
    description: problem.issues?.[0]?.message,
  };
}
