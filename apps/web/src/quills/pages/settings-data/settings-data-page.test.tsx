import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createExportWorkspaceFixture } from "../../api/team/create-export-workspace.fixture";
import { createImportFixture } from "../../api/team/create-import.fixture";
import { createUploadFixture } from "../../api/team/create-upload.fixture";
import { listBoardsFixture } from "../../api/team/list-boards.fixture";
import { listExportRunsDownloadFixture } from "../../api/team/list-export-runs-download.fixture";
import { listExportRunsFixture } from "../../api/team/list-export-runs.fixture";
import { listImportRunsFixture } from "../../api/team/list-import-runs.fixture";
import { listSettingsFixture } from "../../api/team/list-settings.fixture";
import { updateBoardFixture } from "../../api/team/update-board.fixture";
import { wipeWorkspaceDataFixture } from "../../api/team/wipe-workspace-data.fixture";
import { choose, press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsDataPage } from "./settings-data-page";

const failed = {
  id: "import_run_test_1",
  source: "csv" as const,
  fileName: "ideas.csv",
  status: "failed" as const,
  totals: { rows: 2, created: 0, updated: 0, skipped: 0, errors: 1 },
  errorReport: [{ row: 2, message: "Unknown tag: beta", field: "tags" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  finishedAt: "2026-01-01T00:01:00.000Z",
};
const finished = {
  id: "export_run_test_1",
  status: "completed" as const,
  fileName: "posts.csv",
  sizeBytes: 100,
  entityCounts: { posts: 3 },
  error: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  finishedAt: "2026-01-01T00:01:00.000Z",
  expiresAt: "2099-01-08T00:00:00.000Z",
};
const settings = listSettingsFixture.ok({ slug: "acme" });
let api: ReturnType<typeof mockApi>;
/** The three page queries: the import runs, the export runs and the settings overview. */
const prepare = (exported = finished) => {
  api = mockApi();
  api.reply(listImportRunsFixture.ok({ items: [failed] }));
  api.reply(listExportRunsFixture.ok({ items: [exported] }));
  api.reply(settings);
  return api;
};

describe("SettingsDataPage", () => {
  describePageContract(meta, SettingsDataPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.fail();
      },
    },
    ready: {
      prepare: () => {
        prepare();
      },
      assert: async (view) => {
        expect(await view.findByText("ideas.csv")).toBeVisible();
        expect(view.getByText("Row 2: Unknown tag: beta")).toBeVisible();
        expect(
          view.getByText("0 created, 0 updated, 0 skipped, 1 errors"),
        ).toBeVisible();
        expect(view.getByRole("button", { name: "Download" })).toBeVisible();
      },
    },
    done: {
      prepare: () => {
        prepare();
        api.reply(wipeWorkspaceDataFixture.ok({ queued: true }));
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("button", { name: "Delete data" }),
        );
        const dialog = await view.findByRole("alertdialog");
        const confirm = within(dialog).getByRole("button", {
          name: "Delete data",
        });
        expect(confirm).toBeDisabled();
        fireEvent.change(
          within(dialog).getByLabelText("Type acme to confirm"),
          {
            target: { value: "acme" },
          },
        );
        fireEvent.click(confirm);
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("wipeQuillsWorkspaceData")).toHaveLength(1),
        );
        expect(await api.calls("wipeQuillsWorkspaceData")[0]!.json()).toEqual({
          confirm: "acme",
        });
      },
    },
  });

  it("uploads a CSV file, registers it and starts the import", async () => {
    prepare();
    const board = {
      ...updateBoardFixture.ok(),
      id: "board_test_1",
      name: "Ideas",
    };
    api.reply(listBoardsFixture.ok({ items: [board] }));
    api.reply(
      createUploadFixture.ok({
        key: "upload_key_1",
        uploadUrl: "https://storage.example.test/upload-target",
      }),
    );
    api.reply(null);
    api.reply(createImportFixture.ok());
    api.reply(listImportRunsFixture.ok());
    const view = renderPage(SettingsDataPage, meta);
    fireEvent.click(
      await view.findByRole("button", { name: /Import from CSV/ }),
    );
    const sheet = await view.findByRole("dialog", {
      name: "Import posts from a CSV file",
    });
    await within(sheet).findByRole("combobox", { name: "Board" });
    await choose("Board", "Ideas");
    const file = new File(["title,content\nA,B"], "ideas.csv", {
      type: "text/csv",
    });
    fireEvent.change(within(sheet).getByLabelText("CSV file"), {
      target: { files: [file] },
    });
    press("Start import");
    await waitFor(() =>
      expect(api.calls("createQuillsImport")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsUpload")[0]!.json()).toEqual({
      purpose: "file",
      filename: "ideas.csv",
      contentType: "text/csv",
      size: file.size,
    });
    const put = api.calls().find((request) => request.method === "PUT");
    expect(new URL(put!.url).pathname).toBe("/upload-target");
    expect(await api.calls("createQuillsImport")[0]!.json()).toEqual({
      key: "upload_key_1",
      contentType: "text/csv",
      size: file.size,
      name: "ideas.csv",
      boardId: "board_test_1",
    });
  });

  it("queues an export and asks for the address of a finished file", async () => {
    prepare();
    api.reply(createExportWorkspaceFixture.ok());
    api.reply(listExportRunsFixture.ok({ items: [finished] }));
    api.reply(listExportRunsDownloadFixture.ok({ downloadUrl: "#download" }));
    const view = renderPage(SettingsDataPage, meta);
    fireEvent.click(await view.findByRole("button", { name: /Export to CSV/ }));
    const dialog = await view.findByRole("dialog", { name: "Export to CSV" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Start export" }),
    );
    await waitFor(() =>
      expect(api.calls("createQuillsExportWorkspace")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsExportWorkspace")[0]!.json()).toEqual({
      kind: "posts",
    });
    await waitFor(() => expect(view.queryByRole("dialog")).toBeNull());
    press("Download");
    await waitFor(() =>
      expect(api.calls("listQuillsExportRunsDownload")).toHaveLength(1),
    );
  });

  it("says that an expired export file expired and offers no Download", async () => {
    prepare({ ...finished, expiresAt: "2026-01-08T00:00:00.000Z" });
    const view = renderPage(SettingsDataPage, meta);
    expect(
      await view.findByText("The file expired. Start a new export."),
    ).toBeVisible();
    expect(view.queryByRole("button", { name: "Download" })).toBeNull();
  });
});
