import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { CodeBlock } from "./code-block";

afterEach(() => vi.unstubAllGlobals());

describe("CodeBlock", () => {
  it("numbers the lines and copies the whole code", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <CodeBlock label="Start" code={"<script>\n</script>"} />,
    );
    expect(view.getByRole("figure", { name: "Start" })).toHaveTextContent(
      "1<script>2</script>",
    );
    fireEvent.click(view.getByRole("button", { name: "Copy Start" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("<script>\n</script>"),
    );
  });
});
