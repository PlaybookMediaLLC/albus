import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { CommentItem } from "./comment-item";

describe("CommentItem", () => {
  it("shows the comment as one plain line with its post and date", () => {
    const view = renderComponent(
      <CommentItem
        comment={{
          content: "# Title\n\nSee [the docs](https://example.test)",
          postTitle: "Export",
          reactionCount: 1,
          createdAt: "2025-05-12T10:00:00.000Z",
        }}
        href="/posts/1"
        onOpen={() => undefined}
      />,
    );
    const row = view.getByRole("link");
    expect(row).not.toHaveTextContent("#");
    expect(row).toHaveTextContent("See the docs");
    expect(row).toHaveTextContent("Export");
    expect(view.getByLabelText("1 reaction")).toBeInTheDocument();
    expect(row.querySelector("time")).toHaveAttribute(
      "datetime",
      "2025-05-12T10:00:00.000Z",
    );
  });
});
