import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { CopyField } from "./copy-field";
import { toast } from "./upstream";

afterEach(() => vi.unstubAllGlobals());

const secret = "wsec_0123456789abcdefghijklmnopqrstuvwxyz0123456789";

describe("CopyField", () => {
  it("copies the full value and says so", async () => {
    const success = vi.spyOn(toast, "success");
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <CopyField label="Workspace ID" value="workspace_1" />,
    );
    expect(view.getByRole("group", { name: "Workspace ID" })).toHaveTextContent(
      "workspace_1",
    );
    fireEvent.click(view.getByRole("button", { name: "Copy Workspace ID" }));
    await waitFor(() => expect(success).toHaveBeenCalledWith("Copied"));
    expect(writeText).toHaveBeenCalledWith("workspace_1");
  });

  it("shows the start of a masked secret and still copies all of it", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <CopyField label="Signing secret" value={secret} masked />,
    );
    const field = view.getByRole("group", { name: "Signing secret" });
    expect(field).toHaveTextContent("wsec_0123456…");
    expect(field).not.toHaveTextContent("xyz");
    fireEvent.click(view.getByRole("button", { name: "Copy Signing secret" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(secret));
  });

  it("keeps the start and the end of a long value", () => {
    const view = renderComponent(<CopyField label="Key" value={secret} />);
    expect(view.getByRole("group", { name: "Key" })).toHaveTextContent(
      "wsec_0123456789abcdefghijklm…uvwxyz0123456789",
    );
  });

  it("says when the browser cannot copy", async () => {
    const error = vi.spyOn(toast, "error");
    vi.stubGlobal("navigator", {});
    const view = renderComponent(<CopyField label="Key" value="value_1" />);
    fireEvent.click(view.getByRole("button", { name: "Copy Key" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("The value could not be copied."),
    );
  });
});
