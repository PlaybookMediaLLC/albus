import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getFileFixture } from "../../../api/team/get-file.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { AttachmentLink } from "./attachment-link";

describe("AttachmentLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("asks for a fresh download URL on click and opens it", async () => {
    const api = mockApi();
    api.reply(
      getFileFixture.ok({ downloadUrl: "https://storage.example.test/a.pdf" }),
    );
    const tab = { opener: null, location: { href: "" }, close: () => {} };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    renderComponent(
      <AttachmentLink
        workspaceId="workspace_test_1"
        fileId="file_test_1"
        name="invoice.pdf"
      />,
    );
    // Nothing is fetched until the click.
    expect(api.calls("getQuillsFile")).toHaveLength(0);
    press("Attachment: invoice.pdf");
    await vi.waitFor(() =>
      expect(tab.location.href).toBe("https://storage.example.test/a.pdf"),
    );
    expect(new URL(api.calls("getQuillsFile")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/files/file_test_1",
    );
  });

  it("says when the file cannot be opened", async () => {
    mockApi().fail();
    const close = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      opener: null,
      location: { href: "" },
      close,
    } as unknown as Window);
    const view = renderComponent(
      <AttachmentLink
        workspaceId="workspace_test_1"
        fileId="file_test_1"
        name="invoice.pdf"
      />,
    );
    fireEvent.click(view.getByRole("button", { name: /invoice\.pdf/ }));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "The file could not be opened.",
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("shows only the name of a file without an ID", () => {
    const view = renderComponent(
      <AttachmentLink
        workspaceId="workspace_test_1"
        fileId={null}
        name="old.pdf"
      />,
    );
    expect(view.getByText("Attachment: old.pdf")).toBeInTheDocument();
    expect(view.queryByRole("button")).toBeNull();
  });
});
