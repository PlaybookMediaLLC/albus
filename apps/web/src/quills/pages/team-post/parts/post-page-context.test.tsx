import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { postDetail } from "../post.fixture";
import { PostPageContext } from "./post-page-context";

describe("PostPageContext", () => {
  it("shows the page and the browser that a widget post came from", () => {
    const view = renderComponent(
      <PostPageContext
        post={{
          ...postDetail,
          widgetMetadata: {
            pageUrl: "https://app.example/pricing",
            browser: "Safari 19 on macOS",
          },
        }}
      />,
    );
    expect(
      view.getByRole("region", { name: "Page context" }),
    ).toHaveTextContent("https://app.example/pricing");
    expect(view.getByText("Safari 19 on macOS")).toBeInTheDocument();
  });

  it("shows nothing for a post without a page, such as one tracked from a conversation", () => {
    for (const widgetMetadata of [
      null,
      { source: "conversation", conversationId: "conversation_1" },
    ])
      expect(
        renderComponent(
          <PostPageContext post={{ ...postDetail, widgetMetadata }} />,
        ).container,
      ).toBeEmptyDOMElement();
  });
});
