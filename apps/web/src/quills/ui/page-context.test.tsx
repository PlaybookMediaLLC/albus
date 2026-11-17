import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { PageContext } from "./page-context";

describe("PageContext", () => {
  it("shows the page, the browser and the host app's keys as plain text", () => {
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
    // The host app's own metadata follows the page and the browser.
    expect(view.getByText("plan").nextElementSibling).toHaveTextContent("pro");
    expect(view.container.querySelector("a")).toBeNull();
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
