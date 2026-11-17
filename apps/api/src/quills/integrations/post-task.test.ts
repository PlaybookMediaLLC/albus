import { describe, expect, it } from "vite-plus/test";
import { deliveryOf, taskDescription } from "./post-task";

const input = {
  content: "We copy each card by hand.",
  url: "https://kaneo.test/feedback/ws/posts/post_1",
  title: "Export [beta] CSV",
  voters: 5,
  companies: 2,
  mrrCents: 123_456,
  segments: [{ name: "Beta program", voters: 3 }],
  conversations: 1,
};

describe("taskDescription", () => {
  it("keeps the request text a paragraph and links back with the demand counts", () => {
    expect(taskDescription(input)).toBe(
      [
        "We copy each card by hand.",
        "",
        "---",
        "",
        "**Feedback request:** [Export beta CSV](https://kaneo.test/feedback/ws/posts/post_1)",
        "",
        "- Votes: 5 · Companies: 2 · MRR: $1,235",
        "- Top segments: Beta program (3)",
        "- Linked conversations: 1",
      ].join("\n"),
    );
  });

  it("starts with the rule when the request has no text, and leaves out empty segments", () => {
    const text = taskDescription({ ...input, content: "  ", segments: [] });
    expect(text.startsWith("---\n")).toBe(true);
    expect(text).not.toContain("Top segments");
  });
});

describe("deliveryOf", () => {
  it("reads the stored settings and defaults the priority", () => {
    expect(deliveryOf({})).toBeNull();
    expect(
      deliveryOf({ delivery: { projectId: "p", priority: "nope" } }),
    ).toEqual({
      projectId: "p",
      columnId: null,
      priority: "medium",
      triggerStatusId: null,
    });
    expect(
      deliveryOf({
        delivery: { projectId: "p", triggerStatusId: "not-a-status" },
      })?.triggerStatusId,
    ).toBeNull();
  });
});
