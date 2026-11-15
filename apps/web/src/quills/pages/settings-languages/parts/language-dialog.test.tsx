import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { enableHelpCenterLocaleFixture } from "../../../api/team/enable-help-center-locale.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { LanguageDialog, type LanguageDialogProps } from "./language-dialog";

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

const render = (props: Partial<LanguageDialogProps>) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <LanguageDialog
        workspaceId="workspace_1"
        open
        onOpenChange={vi.fn()}
        locale={null}
        available={["de", "fr"]}
        {...props}
      />
    </TeamRuntimeProvider>,
  );

describe("LanguageDialog", () => {
  it("enables the chosen language with its homepage text, then closes", async () => {
    const api = mockApi();
    api.reply(enableHelpCenterLocaleFixture.ok());
    const onOpenChange = vi.fn();
    const view = render({ onOpenChange });
    const dialog = await view.findByRole("dialog", { name: "Add language" });
    await choose("Language", "French");
    fireEvent.change(within(dialog).getByLabelText("Homepage title"), {
      target: { value: "Aide" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(await api.calls("enableQuillsHelpCenterLocale")[0]!.json()).toEqual({
      locale: "fr",
      chrome: {
        homepageTitle: "Aide",
        homepageDescription: "",
        searchPlaceholder: "",
      },
    });
  });

  it("edits the stored text of one language without a language select", async () => {
    const view = render({
      locale: "de",
      chrome: {
        homepageTitle: "Hilfe",
        homepageDescription: "Antworten",
        searchPlaceholder: "Suchen",
      },
    });
    const dialog = await view.findByRole("dialog", { name: "Edit German" });
    expect(within(dialog).getByLabelText("Homepage title")).toHaveValue(
      "Hilfe",
    );
    expect(within(dialog).queryByRole("combobox")).toBeNull();
  });
});
