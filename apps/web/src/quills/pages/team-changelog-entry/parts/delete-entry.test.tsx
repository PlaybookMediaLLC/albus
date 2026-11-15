import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { deleteChangelogEntryFixture } from "../../../api/team/delete-changelog-entry.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { DeleteEntry } from "./delete-entry";

describe("DeleteEntry", () => {
  it("deletes only after the confirmation", async () => {
    const api = mockApi();
    const onDeleted = vi.fn();
    const view = renderComponent(
      inTeam(
        <DeleteEntry
          workspaceId="workspace_test_1"
          entryId="changelog_1"
          onDeleted={onDeleted}
        />,
      ),
    );
    fireEvent.click(view.getByRole("button", { name: "Delete entry" }));
    await view.findByRole("alertdialog");
    expect(api.calls()).toHaveLength(0);
    api.reply(deleteChangelogEntryFixture.ok());
    fireEvent.click(
      view.getAllByRole("button", { name: "Delete entry" }).at(-1)!,
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(
      new URL(api.calls("deleteQuillsChangelogEntry")[0]!.url).pathname,
    ).toBe("/api/quills/workspace_test_1/changelog/changelog_1");
  });
});
