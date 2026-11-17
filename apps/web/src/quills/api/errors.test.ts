import { describe, expect, it } from "vite-plus/test";
import { toPortalProblem } from "./errors";

describe("toPortalProblem", () => {
  it("maps documented validation errors to field issues, without the API's English text", async () => {
    await expect(
      toPortalProblem(
        new Response(
          JSON.stringify({
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            issues: [
              {
                path: "title",
                message: "Too small: expected string to have >=2 characters",
                code: "too_small",
                origin: "string",
                minimum: 2,
              },
              { path: "slug", message: "Bad", code: 5, maximum: "many" },
            ],
          }),
          { status: 400 },
        ),
      ),
    ).resolves.toEqual({
      kind: "invalid",
      // The reason stays as zod's code and bounds; anything malformed is dropped.
      issues: [
        { path: "title", code: "too_small", origin: "string", minimum: 2 },
        { path: "slug" },
      ],
    });
    await expect(
      toPortalProblem(new Response("Bad request", { status: 400 })),
    ).resolves.toEqual({ kind: "failed" });
  });
  it("gives the form field of an issue without the request part", async () => {
    await expect(
      toPortalProblem(
        new Response(
          JSON.stringify({
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            issues: [
              { path: "body.incomingSecret", message: "Too short" },
              { path: "query.subdomain", message: "Invalid" },
            ],
          }),
          { status: 400 },
        ),
      ),
    ).resolves.toEqual({
      kind: "invalid",
      issues: [{ path: "incomingSecret" }, { path: "subdomain" }],
    });
  });
  it("hides a denied record as not found", async () => {
    await expect(
      toPortalProblem(new Response("denied", { status: 403 })),
    ).resolves.toEqual({ kind: "notFound" });
  });
  it("shows a teammate 403 as a denied action", async () => {
    await expect(
      toPortalProblem(new Response("denied", { status: 403 }), "teammate"),
    ).resolves.toEqual({ kind: "noAccess" });
  });
  it("does not return a server response message", async () => {
    await expect(
      toPortalProblem(new Response("private details", { status: 500 })),
    ).resolves.toEqual({ kind: "failed" });
  });
  it("retains a safe retry deadline for rate limits without server text", async () => {
    const before = Date.now();
    const problem = await toPortalProblem(
      new Response("private details", {
        status: 429,
        headers: { "retry-after": "3" },
      }),
    );
    expect(problem.kind).toBe("rateLimited");
    expect(problem.retryAt).toBeGreaterThanOrEqual(before + 3000);
    expect(problem.retryAt).toBeLessThanOrEqual(Date.now() + 3000);
    expect(problem).not.toHaveProperty("message");
  });
});
