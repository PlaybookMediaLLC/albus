import type { PortalProblem } from "./types";

/** Resolves a write to nothing on success and to its problem on failure, for `PortalForm`. */
export const problemOf = (work: Promise<unknown>) =>
  work.then(
    () => undefined,
    (problem: PortalProblem) => problem,
  );
