import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { StatusLabel } from "./status-label";

describe("StatusLabel", () => {
  it("names each status", () => {
    for (const [status, name] of [
      ["draft", "Draft"],
      ["scheduled", "Scheduled"],
      ["published", "Published"],
    ] as const) {
      const view = renderComponent(<StatusLabel status={status} />);
      expect(view.container).toHaveTextContent(name);
      view.unmount();
    }
  });
});
