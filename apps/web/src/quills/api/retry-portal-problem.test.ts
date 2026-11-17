import { describe, expect, it } from "vite-plus/test";
import { retryPortalProblem } from "./retry-portal-problem";

describe("retryPortalProblem", () => {
  it("retries a failed request twice", () => {
    expect(retryPortalProblem(0, { kind: "failed" })).toBe(true);
    expect(retryPortalProblem(1, { kind: "failed" })).toBe(true);
    expect(retryPortalProblem(2, { kind: "failed" })).toBe(false);
  });

  it.each(["notFound", "authRequired", "noAccess", "gone", "invalid"])(
    "does not retry %s, the server's final answer",
    (kind) => {
      expect(retryPortalProblem(0, { kind })).toBe(false);
    },
  );

  it("does not retry an error that is not a portal problem", () => {
    expect(retryPortalProblem(0, new Error("boom"))).toBe(false);
    expect(retryPortalProblem(0, null)).toBe(false);
  });
});
