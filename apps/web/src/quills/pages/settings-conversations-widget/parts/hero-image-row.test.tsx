import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { HeroImageRow } from "./hero-image-row";

const render = () =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_1",
        viewer: { kind: "user", id: "user_1" },
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          manageSettings: true,
        },
      }}
    >
      <HeroImageRow workspaceId="workspace_1" />
    </TeamRuntimeProvider>,
  );

describe("HeroImageRow", () => {
  it("asks for an upload, puts the file, then registers its key", async () => {
    const success = vi.spyOn(toast, "success");
    const api = mockApi();
    api.reply({
      key: "settings/hero.png",
      uploadUrl: "https://storage.example.test/hero",
      headers: { "Content-Type": "image/png" },
      expiresAt: "2026-01-01T00:00:00.000Z",
    });
    api.reply(null);
    api.reply({ changed: true });
    api.reply({});
    const view = render();
    const file = new File(["image"], "hero.png", { type: "image/png" });
    fireEvent.change(view.getByLabelText("Header image"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("The header image is saved."),
    );
    expect(await api.calls("createQuillsSettingsUpload")[0]!.json()).toEqual({
      purpose: "widget_hero",
      filename: "hero.png",
      contentType: "image/png",
      size: 5,
    });
    expect(await api.calls("saveQuillsWidgetHeroImageKey")[0]!.json()).toEqual({
      key: "settings/hero.png",
      contentType: "image/png",
      size: 5,
    });
  });

  it("removes the image", async () => {
    const api = mockApi();
    api.reply({ changed: true });
    api.reply({});
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(api.calls("deleteQuillsWidgetHeroImage")).toHaveLength(1),
    );
  });
});
