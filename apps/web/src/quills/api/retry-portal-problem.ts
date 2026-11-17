import type { PortalProblem } from "../core/types";

// Its own module: the query client loads it, and errors.ts imports the UI barrel.
/** Only a failed request is worth another try; every other problem is the server's final answer. */
export const retryPortalProblem = (failureCount: number, problem: unknown) =>
  (problem as Partial<PortalProblem> | null)?.kind === "failed" &&
  failureCount < 2;
