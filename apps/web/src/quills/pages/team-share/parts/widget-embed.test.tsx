import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { WidgetEmbed } from "./widget-embed";

afterEach(() => vi.unstubAllGlobals());

describe("WidgetEmbed", () => {
  it("shows the SDK URL of this instance and copies all steps", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <WidgetEmbed
        workspaceId="workspace_test_1"
        slug="acme"
        apiBase="https://kaneo.test/api"
        canMintCode={false}
      />,
    );
    expect(
      view.getByRole("figure", { name: "1. Load the widget" }),
    ).toHaveTextContent(
      "https://kaneo.test/api/quills-public/acme/widget/sdk.js",
    );
    expect(
      view.queryByRole("button", { name: "Create install code" }),
    ).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Copy all" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const [[all]] = writeText.mock.calls as unknown as [[string]];
    expect(all).toContain('Quills("init"');
    expect(all).toContain("ssoToken");
  });
});
