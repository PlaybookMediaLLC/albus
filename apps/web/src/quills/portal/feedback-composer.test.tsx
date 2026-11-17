import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPortalPostFixture } from "../api/feedback/create-portal-post.fixture";
import { improvePortalPostDraftFixture } from "../api/feedback/improve-portal-post-draft.fixture";
import { createPortalUploadFixture } from "../api/files/create-portal-upload.fixture";
import { preparePortalUploadFixture } from "../api/files/prepare-portal-upload.fixture";
import { fill, press } from "../test/actions";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { FeedbackComposer } from "./feedback-composer";
import { PortalRuntimeProvider, type PortalRuntimeValue } from "./runtime";
import { getPublicPortalConfigFixture } from "../api/portal/get-public-portal-config.fixture";

const runtime: PortalRuntimeValue = {
  config: {
    name: "Workspace",
    features: {
      allowAnonymous: false,
      allowEditAfterEngagement: false,
      allowDeleteAfterEngagement: false,
      showPublicEditHistory: false,
      ai: true,
    },
    portalAccess: { isPrivate: false },
    nav: getPublicPortalConfigFixture.ok().nav,
    branding: {
      logoUrl: null,
      theme: { themeMode: "user", light: {}, dark: {} },
      headerDisplayMode: "logo_and_name",
      headerDisplayName: null,
    },
  },
  viewer: { kind: "user", id: "account_test_1" },
  access: {
    granted: true,
    reason: "public",
    signIn: { mode: "kaneo", ssoUrl: null },
  },
  accessLoading: false,
  accessProblem: null,
};

describe("FeedbackComposer", () => {
  it("offers a retry and keeps the draft when the file storage fails", async () => {
    const api = mockApi();
    api.reply(preparePortalUploadFixture.ok());
    api.reply(createPortalUploadFixture.ok());
    api.fail(new TypeError("Failed to fetch"));
    const view = renderComponent(
      <PortalRuntimeProvider value={runtime}>
        <FeedbackComposer
          workspaceId="workspace_test_1"
          boards={[{ id: "board_test_1", name: "Ideas" }]}
          onTitleChange={vi.fn()}
        />
      </PortalRuntimeProvider>,
    );
    fireEvent.focus(view.getByLabelText("Title"));
    fill("Title", "Export to CSV");
    fireEvent.change(view.getByLabelText("Attach files"), {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });
    press("Submit feedback");
    expect(
      await view.findByRole("button", { name: "Try again" }),
    ).toBeEnabled();
    expect(view.getByLabelText("Title")).toHaveValue("Export to CSV");
    expect(api.calls("createQuillsPortalPost")).toHaveLength(0);
  });

  it("creates a post with a draft key and no files", async () => {
    const api = mockApi();
    api.reply(createPortalPostFixture.ok());
    const view = renderComponent(
      <PortalRuntimeProvider value={runtime}>
        <FeedbackComposer
          workspaceId="workspace_test_1"
          boards={[{ id: "board_test_1", name: "Ideas" }]}
          onTitleChange={vi.fn()}
        />
      </PortalRuntimeProvider>,
    );
    fireEvent.focus(view.getByLabelText("Title"));
    fill("Title", "Export to CSV");
    expect(view.getByLabelText("Attach files")).toBeInTheDocument();
    press("Submit feedback");
    await waitFor(() =>
      expect(api.calls("createQuillsPortalPost")).toHaveLength(1),
    );
    const [request] = api.calls("createQuillsPortalPost");
    expect(await request!.json()).toMatchObject({
      boardId: "board_test_1",
      title: "Export to CSV",
      attachmentIds: [],
      idempotencyKey: expect.any(String),
    });
  });

  it("sends the board's field values typed, and leaves empty ones out", async () => {
    const api = mockApi();
    api.reply(createPortalPostFixture.ok());
    const view = renderComponent(
      <PortalRuntimeProvider value={runtime}>
        <FeedbackComposer
          workspaceId="workspace_test_1"
          boards={[
            {
              id: "board_test_1",
              name: "Ideas",
              fields: [
                {
                  key: "seats",
                  label: "Seats",
                  type: "number",
                  required: true,
                },
                { key: "note", label: "Note", type: "text", required: false },
              ],
            },
          ]}
          onTitleChange={vi.fn()}
        />
      </PortalRuntimeProvider>,
    );
    fireEvent.focus(view.getByLabelText("Title"));
    fill("Title", "Export to CSV");
    fireEvent.change(view.getByLabelText("Seats (required)"), {
      target: { value: "12" },
    });
    press("Submit feedback");
    await waitFor(() =>
      expect(api.calls("createQuillsPortalPost")).toHaveLength(1),
    );
    const body = await api.calls("createQuillsPortalPost")[0]!.json();
    expect(body.customFields).toEqual({ seats: 12 });
  });

  it("offers no AI help when the instance has no AI provider", () => {
    const view = renderComponent(
      <PortalRuntimeProvider
        value={{
          ...runtime,
          config: {
            ...runtime.config,
            features: { ...runtime.config.features, ai: false },
          },
        }}
      >
        <FeedbackComposer
          workspaceId="workspace_test_1"
          boards={[{ id: "board_test_1", name: "Ideas" }]}
          autoFocus
          onTitleChange={vi.fn()}
        />
      </PortalRuntimeProvider>,
    );
    expect(
      view.queryByRole("button", { name: "Suggest a title with AI" }),
    ).not.toBeInTheDocument();
  });

  it("replaces only the title and board with an accepted AI suggestion", async () => {
    const api = mockApi();
    api.reply(
      improvePortalPostDraftFixture.ok({
        title: "Export reports as CSV",
        boardId: "board_test_2",
        boardName: "Reports",
      }),
    );
    const view = renderComponent(
      <PortalRuntimeProvider value={runtime}>
        <FeedbackComposer
          workspaceId="workspace_test_1"
          boards={[
            { id: "board_test_1", name: "Ideas" },
            { id: "board_test_2", name: "Reports" },
          ]}
          onTitleChange={vi.fn()}
        />
      </PortalRuntimeProvider>,
    );
    fireEvent.focus(view.getByLabelText("Title"));
    fill("Title", "csv");
    fill("Details", "boss wants reports");
    press("Suggest a title with AI");
    await view.findByRole("region", { name: "Suggestion from AI" });
    const [request] = api.calls("improveQuillsPortalPostDraft");
    expect(await request!.json()).toEqual({
      title: "csv",
      details: "boss wants reports",
      boardId: "board_test_1",
    });
    press("Use this");
    expect(view.getByLabelText("Title")).toHaveValue("Export reports as CSV");
    expect(view.getByLabelText("Details")).toHaveValue("boss wants reports");
    expect(view.getByRole("combobox", { name: "Board" })).toHaveTextContent(
      "Reports",
    );
    expect(api.calls("createQuillsPortalPost")).toHaveLength(0);
  });
});
