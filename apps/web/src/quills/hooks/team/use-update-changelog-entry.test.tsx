import { act } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { getChangelogEntryKey } from "../../api/team/get-changelog-entry";
import { getChangelogEntryFixture } from "../../api/team/get-changelog-entry.fixture";
import { updateChangelogEntryFixture } from "../../api/team/update-changelog-entry.fixture";
import { mockApi } from "../../test/mock-api";
import { renderQuillsHook } from "../../test/render";
import { useUpdateChangelogEntry } from "./use-update-changelog-entry";
describe("useUpdateChangelogEntry", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateChangelogEntry,
    operationId: "updateQuillsChangelogEntry",
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
      json: {},
    },
    response: updateChangelogEntryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listChangelog",
      ),
    ],
  });

  it("puts the reply into the cached entry and leaves other entries", async () => {
    const viewer = { kind: "user" as const, id: "user_test_1" };
    const key = (entryId: string) =>
      getChangelogEntryKey(
        { param: { workspaceId: "workspace_test_1", entryId } },
        viewer,
      );
    const other = getChangelogEntryFixture.ok({ id: "changelog_2" });
    mockApi().reply(
      updateChangelogEntryFixture.ok({ id: "changelog_1", title: "New" }),
    );
    const view = renderQuillsHook(() => useUpdateChangelogEntry(viewer), {});
    view.queryClient.setQueryData(
      key("changelog_1"),
      getChangelogEntryFixture.ok({ id: "changelog_1", title: "Old" }),
    );
    view.queryClient.setQueryData(key("changelog_2"), other);
    await act(() =>
      view.result.current.mutateAsync({
        param: { workspaceId: "workspace_test_1", entryId: "changelog_1" },
        json: { title: "New" },
      }),
    );
    expect(view.queryClient.getQueryData(key("changelog_1"))).toMatchObject({
      title: "New",
    });
    expect(view.queryClient.getQueryData(key("changelog_2"))).toBe(other);
  });
});
