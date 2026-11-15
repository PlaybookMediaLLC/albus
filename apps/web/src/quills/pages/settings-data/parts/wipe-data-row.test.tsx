import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { WipeDataRow } from "./wipe-data-row";

describe("WipeDataRow", () => {
  it("deletes the data only after the slug is typed", async () => {
    const success = vi.spyOn(toast, "success");
    const api = mockApi();
    api.reply({ queued: true });
    const view = renderComponent(
      <WipeDataRow workspaceId="workspace_1" slug="acme" />,
    );
    press("Delete data");
    const dialog = await view.findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "Delete data" });
    fireEvent.change(within(dialog).getByLabelText("Type acme to confirm"), {
      target: { value: "acm" },
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Type acme to confirm"), {
      target: { value: "acme" },
    });
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("The deletion started."),
    );
    expect(await api.calls("wipeQuillsWorkspaceData")[0]!.json()).toEqual({
      confirm: "acme",
    });
  });

  it("keeps the confirmation disabled while the slug is unknown", async () => {
    mockApi();
    const view = renderComponent(
      <WipeDataRow workspaceId="workspace_1" slug="" />,
    );
    press("Delete data");
    const dialog = await view.findByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: "Delete data" }),
    ).toBeDisabled();
  });
});
