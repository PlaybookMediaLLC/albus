import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { ExportDialog } from "./export-dialog";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

describe("ExportDialog", () => {
  it("queues the chosen data and says when an export already runs", async () => {
    const error = vi.spyOn(toast, "error");
    const api = mockApi();
    api.reply({ message: "An export already runs" }, 409);
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <ExportDialog workspaceId="workspace_1" />
      </TeamRuntimeProvider>,
    );
    fireEvent.click(view.getByRole("button", { name: /Export to CSV/ }));
    const dialog = await view.findByRole("dialog", { name: "Export to CSV" });
    await choose("Data", "People");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Start export" }),
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "An export already runs in this workspace. Try again when it finishes.",
      ),
    );
    expect(
      within(dialog).getByRole("button", { name: "Start export" }),
    ).toBeEnabled();
    await waitFor(() =>
      expect(api.calls("createQuillsExportWorkspace")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsExportWorkspace")[0]!.json()).toEqual({
      kind: "users",
    });
  });
});
