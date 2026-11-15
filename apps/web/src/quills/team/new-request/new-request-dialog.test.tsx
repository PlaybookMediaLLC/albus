import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostFixture } from "../../api/team/create-post.fixture";
import { TeamRuntimeProvider } from "../runtime";
import { fill, press } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { postTeam } from "../../pages/team-post/post.fixture";
import {
  inboxBoards,
  inboxStatuses,
  inboxTags,
} from "../../pages/team-posts/inbox.fixture";
import {
  NewRequestDialog,
  type NewRequestDialogProps,
} from "./new-request-dialog";

const render = (props: Partial<NewRequestDialogProps> = {}) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <NewRequestDialog
        workspaceId="workspace_test_1"
        boards={inboxBoards.items}
        statuses={inboxStatuses.statuses}
        boardId="board_ideas"
        onClose={vi.fn()}
        onCreated={vi.fn()}
        {...props}
      />
    </TeamRuntimeProvider>,
  );

describe("NewRequestDialog", () => {
  it("creates the request on the chosen board and opens it", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    api.reply(createPostFixture.ok({ id: "post_dark" }));
    const onCreated = vi.fn();
    const view = render({ onCreated });
    expect(
      await view.findByRole("dialog", { name: "New request" }),
    ).toBeVisible();
    fill("Request title", "Dark mode");
    press("Create");
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("post_dark"));
    await expect(
      api.calls("createQuillsPost")[0]!.clone().json(),
    ).resolves.toMatchObject({
      boardId: "board_ideas",
      title: "Dark mode",
      statusId: "status_open",
    });
  });

  it("puts the focus in the title field when it opens", async () => {
    mockApi().reply(inboxTags);
    const view = render();
    await view.findByRole("dialog");
    await waitFor(() =>
      expect(view.getByLabelText("Request title")).toHaveFocus(),
    );
  });

  it("starts on the status of defaultStatusId", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    api.reply(createPostFixture.ok({ id: "post_dark" }));
    const onCreated = vi.fn();
    const view = render({ defaultStatusId: "status_planned", onCreated });
    expect(
      await view.findByRole("combobox", { name: "Status" }),
    ).toHaveTextContent("Planned");
    fill("Request title", "Dark mode");
    press("Create");
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    await expect(
      api.calls("createQuillsPost")[0]!.clone().json(),
    ).resolves.toMatchObject({ statusId: "status_planned" });
  });

  it("starts on the default status when defaultStatusId no longer exists", async () => {
    mockApi().reply(inboxTags);
    const view = render({ defaultStatusId: "status_deleted" });
    expect(
      await view.findByRole("combobox", { name: "Status" }),
    ).toHaveTextContent("Open");
  });

  it("closes without a request on Escape or the close button", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    const onClose = vi.fn();
    const view = render({ onClose });
    fireEvent.keyDown(await view.findByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    press("Close");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
    expect(api.calls("createQuillsPost")).toHaveLength(0);
  });
});
