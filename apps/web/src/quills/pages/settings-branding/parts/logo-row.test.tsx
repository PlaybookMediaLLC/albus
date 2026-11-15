import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createSettingsUploadFixture } from "../../../api/team/create-settings-upload.fixture";
import { deleteLogoFixture } from "../../../api/team/delete-logo.fixture";
import { saveLogoKeyFixture } from "../../../api/team/save-logo-key.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { LogoRow } from "./logo-row";

const pick = (view: ReturnType<typeof renderComponent>, file: File) =>
  fireEvent.change(view.container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });

describe("LogoRow", () => {
  it("uploads the logo in three steps, then reloads it", async () => {
    const api = mockApi();
    api.reply(
      createSettingsUploadFixture.ok({
        key: "logos/one.png",
        uploadUrl: "https://storage.test/put",
        headers: { "Content-Type": "image/png" },
      }),
    );
    api.reply({});
    api.reply(saveLogoKeyFixture.ok({ changed: true }));
    const onChanged = vi.fn(async () => undefined);
    const view = renderComponent(
      <LogoRow workspaceId="workspace_1" logoUrl={null} onChanged={onChanged}>
        {null}
      </LogoRow>,
    );
    pick(view, new File(["png"], "one.png", { type: "image/png" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(await api.calls("createQuillsSettingsUpload")[0]!.json()).toEqual({
      purpose: "logo",
      filename: "one.png",
      contentType: "image/png",
      size: 3,
    });
    expect(api.calls()[1]!.method).toBe("PUT");
    expect(api.calls()[1]!.url).toBe("https://storage.test/put");
    expect(await api.calls("saveQuillsLogoKey")[0]!.json()).toEqual({
      key: "logos/one.png",
      contentType: "image/png",
      size: 3,
    });
  });

  it("refuses a file type that the API does not accept", () => {
    const error = vi.spyOn(toast, "error");
    const api = mockApi();
    const view = renderComponent(
      <LogoRow workspaceId="workspace_1" logoUrl={null} onChanged={vi.fn()}>
        {null}
      </LogoRow>,
    );
    pick(view, new File(["gif"], "one.gif", { type: "image/gif" }));
    expect(error).toHaveBeenCalledWith("Use a PNG, JPEG, WebP or SVG image.");
    expect(api.calls()).toHaveLength(0);
  });

  it("removes the logo from the row menu", async () => {
    const api = mockApi();
    api.reply(deleteLogoFixture.ok({ changed: true }));
    const onChanged = vi.fn(async () => undefined);
    const view = renderComponent(
      <LogoRow
        workspaceId="workspace_1"
        logoUrl="https://cdn.test/logo.png"
        onChanged={onChanged}
      >
        {null}
      </LogoRow>,
    );
    fireEvent.click(view.getByRole("button", { name: "Logo actions" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Remove logo" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.calls("deleteQuillsLogo")).toHaveLength(1);
  });

  it("hides the menu without a logo or without the permission", () => {
    const view = renderComponent(
      <LogoRow
        workspaceId="workspace_1"
        logoUrl="https://cdn.test/logo.png"
        disabled
        onChanged={vi.fn()}
      >
        {null}
      </LogoRow>,
    );
    expect(view.queryByRole("button", { name: "Logo actions" })).toBeNull();
    expect(view.getByRole("button", { name: "Upload a logo" })).toBeDisabled();
  });
});
