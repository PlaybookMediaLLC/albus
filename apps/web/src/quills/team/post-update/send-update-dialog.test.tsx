import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { previewPostUpdateFixture } from "../../api/team/preview-post-update.fixture";
import { sendPostUpdateFixture } from "../../api/team/send-post-update.fixture";
import { postTeam } from "../../pages/team-post/post.fixture";
import { TeamRuntimeProvider } from "../runtime";
import { fill, press } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { toast } from "../../ui/upstream";
import { SendUpdateDialog } from "./send-update-dialog";

const counts = {
  page: 1,
  email: 3,
  emailEstimated: false,
  conversations: 1,
  slack: 0,
};
const render = (onClose = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <SendUpdateDialog
        workspaceId="workspace_test_1"
        post={{ id: "post_export", title: "Export to CSV" }}
        onClose={onClose}
      />
    </TeamRuntimeProvider>,
  );
/** The segments, then the first preview. */
const replyReads = (api: ReturnType<typeof mockApi>) => {
  api.reply({ segments: [{ id: "segment_beta", name: "Beta" }] });
  api.reply(previewPostUpdateFixture.ok({ counts, slackConnected: false }));
};

describe("SendUpdateDialog", () => {
  it("shows the preview's counts and sends once the release is confirmed", async () => {
    const api = mockApi();
    replyReads(api);
    api.reply(sendPostUpdateFixture.ok({ counts }));
    const onClose = vi.fn();
    const success = vi.spyOn(toast, "success");
    const view = render(onClose);
    expect(await view.findByText("3 people")).toBeVisible();
    expect(view.getByText("1 conversation")).toBeVisible();
    expect(
      view.getByRole("checkbox", { name: "Post to Slack" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      view.getByText("No Slack connection posts this board's comments."),
    ).toBeVisible();

    fill("Message", "CSV export shipped today.");
    press("Send update");
    expect(
      await view.findByText(
        "Confirm that the change shipped before you send the update.",
      ),
    ).toBeVisible();
    expect(api.calls("sendQuillsPostUpdate")).toHaveLength(0);

    fireEvent.click(
      view.getByRole("checkbox", { name: "I confirm this change has shipped" }),
    );
    press("Send update");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(success).toHaveBeenCalledWith(
      "Update sent. 3 emails are on their way.",
    );
    const [request] = api.calls("sendQuillsPostUpdate");
    expect(await request!.json()).toEqual({
      body: "CSV export shipped today.",
      confirmRelease: true,
      channels: { page: true, email: true, conversations: true, slack: false },
      segmentIds: [],
      languages: [],
      idempotencyKey: expect.any(String),
    });
  });

  it("counts again for a segment and refuses a malformed language", async () => {
    const api = mockApi();
    replyReads(api);
    api.reply(
      previewPostUpdateFixture.ok({
        counts: { ...counts, email: 1 },
        slackConnected: false,
      }),
    );
    const view = render();
    await view.findByText("3 people");
    fireEvent.click(view.getByRole("checkbox", { name: "Beta" }));
    expect(await view.findByText("1 person")).toBeVisible();
    const previews = api.calls("previewQuillsPostUpdate");
    expect(await previews.at(-1)!.json()).toMatchObject({
      segmentIds: ["segment_beta"],
      languages: [],
    });

    fill("Only these languages", "French!");
    fill("Message", "Shipped.");
    fireEvent.click(
      view.getByRole("checkbox", { name: "I confirm this change has shipped" }),
    );
    press("Send update");
    expect(
      await view.findByText(
        "Use up to 10 language tags separated by commas, such as fr, pt-br.",
      ),
    ).toBeVisible();
    expect(api.calls("sendQuillsPostUpdate")).toHaveLength(0);
    expect(api.calls("previewQuillsPostUpdate")).toHaveLength(previews.length);
  });
});
