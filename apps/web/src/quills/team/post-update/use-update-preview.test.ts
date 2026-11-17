import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { previewPostUpdateFixture } from "../../api/team/preview-post-update.fixture";
import { advanceClock } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderQuillsHook } from "../../test/render";
import { useUpdatePreview, type UpdateTargets } from "./use-update-preview";

const channels = {
  page: true,
  email: true,
  conversations: false,
  slack: false,
};
const counts = {
  page: 1,
  email: 2,
  emailEstimated: false,
  conversations: 0,
  slack: 0,
};
const render = (targets: UpdateTargets) =>
  renderQuillsHook(
    (props: UpdateTargets) =>
      useUpdatePreview("workspace_test_1", "post_export", props),
    { initialProps: targets },
  );

describe("useUpdatePreview", () => {
  afterEach(() => vi.useRealTimers());
  it("counts the current choice once it settles", async () => {
    const api = mockApi();
    api.reply(previewPostUpdateFixture.ok({ counts, slackConnected: true }));
    const view = render({ channels, segmentIds: [], languages: ["fr"] });
    await vi.waitFor(() => expect(view.result.current.counts).toEqual(counts));
    expect(view.result.current.slackConnected).toBe(true);
    const [request] = api.calls("previewQuillsPostUpdate");
    expect(await request!.json()).toEqual({
      channels,
      segmentIds: [],
      languages: ["fr"],
    });
  });

  it("counts nothing while the languages are not valid", async () => {
    vi.useFakeTimers();
    const api = mockApi();
    const view = render({ channels, segmentIds: [], languages: null });
    await advanceClock(1000);
    expect(api.calls("previewQuillsPostUpdate")).toHaveLength(0);
    expect(view.result.current.counts).toBeUndefined();
  });
});
