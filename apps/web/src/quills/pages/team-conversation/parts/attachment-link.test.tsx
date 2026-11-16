import type { ReactElement } from "react";
import { describe, expect, it } from "vite-plus/test";
import { getFileFixture } from "../../../api/team/get-file.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { AttachmentLink } from "./attachment-link";

const team = {
  workspaceId: "workspace_test_1",
  viewer: { kind: "user" as const, id: "user_test_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};
const render = (element: ReactElement) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>{element}</TeamRuntimeProvider>,
  );

describe("AttachmentLink", () => {
  it("links the file once its download URL loads", async () => {
    const api = mockApi();
    api.reply(
      getFileFixture.ok({ downloadUrl: "https://storage.example.test/a.pdf" }),
    );
    const view = render(
      <AttachmentLink
        workspaceId="workspace_test_1"
        fileId="file_test_1"
        name="invoice.pdf"
      />,
    );
    expect(
      await view.findByRole("link", { name: "Attachment: invoice.pdf" }),
    ).toHaveAttribute("href", "https://storage.example.test/a.pdf");
    expect(new URL(api.calls("getQuillsFile")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/files/file_test_1",
    );
  });

  it("shows only the name of a file without an ID", () => {
    const api = mockApi();
    const view = render(
      <AttachmentLink
        workspaceId="workspace_test_1"
        fileId={null}
        name="old.pdf"
      />,
    );
    expect(view.getByText("Attachment: old.pdf")).toBeInTheDocument();
    expect(api.calls("getQuillsFile")).toHaveLength(0);
  });
});
