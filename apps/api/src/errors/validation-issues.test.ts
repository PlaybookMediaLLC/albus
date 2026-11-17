import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { formatValidationIssues } from "./validation-issues";

describe("formatValidationIssues", () => {
  it("carries the validator's issue code and bounds, so a client can translate the issue", () => {
    const result = z
      .object({
        title: z.string().min(2).max(5),
        slug: z.string().regex(/^[a-z]+$/),
        count: z.number(),
      })
      .safeParse({ title: "a", slug: "A", count: "x" });
    expect(formatValidationIssues(result.error!.issues, "json").issues).toEqual(
      [
        {
          path: "body.title",
          message: "Too small: expected string to have >=2 characters",
          code: "too_small",
          origin: "string",
          minimum: 2,
        },
        {
          path: "body.slug",
          message: "Invalid string: must match pattern /^[a-z]+$/",
          code: "invalid_format",
          origin: "string",
        },
        {
          path: "body.count",
          message: "Invalid input: expected number, received string",
          code: "invalid_type",
        },
      ],
    );
  });

  it("keeps the first issue as the message and lists every issue", () => {
    expect(
      formatValidationIssues(
        [
          { path: ["title"], message: "Required" },
          { path: ["priority"], message: "Invalid option" },
          { path: ["labels", 0, "name"], message: "Too long" },
        ],
        "json",
      ),
    ).toEqual({
      message: "title: Required",
      issues: [
        { path: "body.title", message: "Required" },
        { path: "body.priority", message: "Invalid option" },
        { path: "body.labels.0.name", message: "Too long" },
      ],
    });
  });

  it.each([
    ["query", "query.limit"],
    ["param", "params.limit"],
    ["form", "body.limit"],
    ["header", "header.limit"],
    ["cookie", "cookie.limit"],
  ])("prefixes %s issues with the request part", (target, path) => {
    expect(
      formatValidationIssues([{ path: ["limit"], message: "Too big" }], target)
        .issues,
    ).toEqual([{ path, message: "Too big" }]);
  });

  it("leaves the path unprefixed when the request part is unknown", () => {
    expect(
      formatValidationIssues([{ path: ["limit"], message: "Too big" }]),
    ).toEqual({
      message: "limit: Too big",
      issues: [{ path: "limit", message: "Too big" }],
    });
  });

  it("names root issues after the request part", () => {
    expect(
      formatValidationIssues(
        [{ path: [], message: "Expected object" }],
        "json",
      ),
    ).toEqual({
      message: "request: Expected object",
      issues: [{ path: "body", message: "Expected object" }],
    });
  });

  it("stringifies symbol path segments", () => {
    expect(
      formatValidationIssues([{ path: [Symbol("key")], message: "Bad" }])
        .issues,
    ).toEqual([{ path: "Symbol(key)", message: "Bad" }]);
  });

  it("describes an empty issue list", () => {
    expect(formatValidationIssues([], "query")).toEqual({
      message: "Invalid request",
      issues: [],
    });
  });
});
