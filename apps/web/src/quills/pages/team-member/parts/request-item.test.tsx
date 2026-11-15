import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { RequestItem } from "./request-item";

describe("RequestItem", () => {
  it("shows the votes, the board, the status and the comments, and opens the post", () => {
    const onOpen = vi.fn();
    const view = renderComponent(
      <RequestItem
        post={{ title: "Dark mode", voteCount: 3, commentCount: 2 }}
        boardName="Ideas"
        status={{ name: "Planned", color: "#336699" }}
        href="/posts/1"
        onOpen={onOpen}
      />,
    );
    const row = view.getByRole("link", { name: /Dark mode/ });
    expect(view.getByLabelText("3 votes")).toHaveTextContent("3");
    expect(view.getByLabelText("2 comments")).toHaveTextContent("2");
    expect(row).toHaveTextContent("Ideas");
    expect(row).toHaveTextContent("Planned");
    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
