import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { PageContext } from "./page-context";

describe("PageContext", () => {
  it("shows the page and the browser as plain text, and no other key", () => {
    const view = renderComponent(
      <PageContext
        context={{
          pageUrl: "javascript:alert(1)",
          browser: "Chrome 153 on Linux",
          plan: "pro",
        }}
      />,
    );
    expect(view.getByText("Page").nextElementSibling).toHaveTextContent(
      "javascript:alert(1)",
    );
    expect(view.getByText("Browser").nextElementSibling).toHaveTextContent(
      "Chrome 153 on Linux",
    );
    expect(view.container.querySelector("a")).toBeNull();
    expect(view.queryByText("pro")).toBeNull();
  });

  it("renders nothing without a page or a browser", () => {
    const contexts: (Record<string, string> | null | undefined)[] = [
      null,
      undefined,
      {},
      { source: "conversation" },
    ];
    for (const context of contexts)
      expect(
        renderComponent(<PageContext context={context} />).container,
      ).toBeEmptyDOMElement();
  });
});
