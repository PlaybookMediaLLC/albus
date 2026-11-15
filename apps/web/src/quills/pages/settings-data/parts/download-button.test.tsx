import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { DownloadButton } from "./download-button";

describe("DownloadButton", () => {
  it("asks for the address of the file of this run", async () => {
    const api = mockApi();
    api.reply({
      fileName: "posts.csv",
      downloadUrl: "#file",
      downloadExpiresAt: "2026-01-01T00:00:00.000Z",
    });
    renderComponent(<DownloadButton workspaceId="workspace_1" runId="run_1" />);
    press("Download");
    await waitFor(() =>
      expect(api.calls("listQuillsExportRunsDownload")).toHaveLength(1),
    );
    expect(
      new URL(api.calls("listQuillsExportRunsDownload")[0]!.url).pathname,
    ).toBe("/api/quills/workspace_1/transfer/export-runs/run_1/download");
  });

  it("says when the file is not available", async () => {
    const error = vi.spyOn(toast, "error");
    mockApi().reply({ message: "Expired" }, 409);
    renderComponent(<DownloadButton workspaceId="workspace_1" runId="run_1" />);
    press("Download");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("The file could not be downloaded."),
    );
  });
});
