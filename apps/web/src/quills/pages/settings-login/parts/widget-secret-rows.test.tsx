import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { WidgetSecretRows } from "./widget-secret-rows";

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

const render = (secret: string | null) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <WidgetSecretRows workspaceId="workspace_1" secret={secret} />
    </TeamRuntimeProvider>,
  );

describe("WidgetSecretRows", () => {
  it("rotates after a confirmation and shows the new secret in full once", async () => {
    const api = mockApi();
    api.reply({ secret: "wsec_new_secret_value_1" });
    api.reply({ secret: "wsec_new_secret_value_1" });
    const view = render("wsec_old_secret_value_1");
    fireEvent.click(view.getByRole("button", { name: "Rotate" }));
    const dialog = await view.findByRole("alertdialog", {
      name: "Rotate the widget secret?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rotate" }));
    await waitFor(() =>
      expect(
        view.getByRole("group", { name: "Widget signing secret" }),
      ).toHaveTextContent("wsec_new_secret_value_1"),
    );
    expect(api.calls("rotateQuillsWidgetSecret")).toHaveLength(1);
  });

  it("creates the first secret without a confirmation and says when that fails", async () => {
    const error = vi.spyOn(toast, "error");
    const api = mockApi();
    api.reply({ message: "Forbidden" }, 403);
    const view = render(null);
    fireEvent.click(view.getByRole("button", { name: "Create secret" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("The secret could not be changed."),
    );
    expect(api.calls("rotateQuillsWidgetSecret")).toHaveLength(1);
  });
});
