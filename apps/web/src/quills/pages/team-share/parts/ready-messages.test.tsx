import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { ReadyMessages } from "./ready-messages";

afterEach(() => vi.unstubAllGlobals());

describe("ReadyMessages", () => {
  it("opens a message with the workspace and the URL and copies it", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <ReadyMessages workspace="Acme" url="https://a.test" />,
    );
    expect(view.getAllByRole("button", { expanded: false })).toHaveLength(6);
    fireEvent.click(view.getByRole("button", { name: /Team chat/ }));
    fireEvent.click(
      await view.findByRole("button", { name: "Copy Team chat" }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const [[message]] = writeText.mock.calls as unknown as [[string]];
    expect(message).toContain("Acme");
    expect(message).toContain("https://a.test");
  });
});
