import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getFileFixture } from "../../../api/team/get-file.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postDetail } from "../post.fixture";
import { PostAttachments } from "./post-attachments";

const attachments = [
  {
    id: "file_test_1",
    name: "screenshot.png",
    contentType: "image/png",
    size: 10,
  },
];

describe("PostAttachments", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists the author's images and opens one with a fresh download URL", async () => {
    const api = mockApi();
    api.reply(
      getFileFixture.ok({ downloadUrl: "https://storage.example.test/s.png" }),
    );
    const tab = { opener: null, location: { href: "" }, close: () => {} };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    const view = renderComponent(
      <PostAttachments
        workspaceId="workspace_test_1"
        post={{ ...postDetail, attachments }}
      />,
    );
    expect(
      view.getByRole("region", { name: "Attachments" }),
    ).toBeInTheDocument();
    expect(api.calls("getQuillsFile")).toHaveLength(0);
    press("Open screenshot.png");
    await vi.waitFor(() =>
      expect(tab.location.href).toBe("https://storage.example.test/s.png"),
    );
    expect(new URL(api.calls("getQuillsFile")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/files/file_test_1",
    );
  });

  it("shows nothing for a post without attachments", () => {
    expect(
      renderComponent(
        <PostAttachments workspaceId="workspace_test_1" post={postDetail} />,
      ).container,
    ).toBeEmptyDOMElement();
  });
});
