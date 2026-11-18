import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPortalUploadFixture } from "../api/files/create-portal-upload.fixture";
import { preparePortalUploadFixture } from "../api/files/prepare-portal-upload.fixture";
import { deleteCustomerAvatarFixture } from "../api/portal/delete-customer-avatar.fixture";
import { saveCustomerAvatarFixture } from "../api/portal/save-customer-avatar.fixture";
import { mockApi } from "../test/mock-api";
import { renderQuillsHook } from "../test/render";
import { useAvatarUpload } from "./use-avatar-upload";

// The canvas crop needs a real browser; the hook only needs its output.
vi.mock("@/lib/prepare-avatar-image", () => ({
  prepareAvatarImage: async () => ({
    contentType: "image/webp",
    data: btoa("tiny"),
  }),
}));

const viewer = { kind: "user", id: "user_test_1" } as const;
const chosen = new File(["original"], "me.png", { type: "image/png" });

describe("useAvatarUpload", () => {
  it("uploads the prepared square to the caller's key and saves it", async () => {
    const api = mockApi();
    api.reply(preparePortalUploadFixture.ok({ ready: true }));
    api.reply(
      createPortalUploadFixture.ok({
        key: "workspace/ws/quills/customer_avatar/c_1/a.webp",
        uploadUrl: "https://media.example.test/upload",
        headers: { "Content-Type": "image/webp" },
      }),
    );
    api.reply({});
    api.reply(saveCustomerAvatarFixture.ok({ changed: true }));
    const view = renderQuillsHook(
      () => useAvatarUpload("workspace_test_1", viewer),
      {},
    );
    await act(() => view.result.current.upload(chosen));
    expect(view.result.current.failed).toBe(false);
    expect(
      await api.calls("createQuillsPortalUpload")[0]!.json(),
    ).toMatchObject({
      purpose: "customer_avatar",
      contentType: "image/webp",
      size: 4,
    });
    expect(await api.calls("saveQuillsCustomerAvatar")[0]!.json()).toEqual({
      key: "workspace/ws/quills/customer_avatar/c_1/a.webp",
      contentType: "image/webp",
      size: 4,
    });
  });

  it("says when a step fails and removes a picture", async () => {
    const api = mockApi();
    api.fail();
    api.reply(deleteCustomerAvatarFixture.ok({ changed: true }));
    const view = renderQuillsHook(
      () => useAvatarUpload("workspace_test_1", viewer),
      {},
    );
    await act(() => view.result.current.upload(chosen));
    expect(view.result.current.failed).toBe(true);
    await act(() => view.result.current.remove());
    expect(view.result.current.failed).toBe(false);
    expect(api.calls("deleteQuillsCustomerAvatar")).toHaveLength(1);
  });
});
