import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createTagFixture } from "../../../api/team/create-tag.fixture";
import { setPostTagsFixture } from "../../../api/team/set-post-tags.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { fill, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inboxTags } from "../../team-posts/inbox.fixture";
import { postDetail, postTeam } from "../post.fixture";
import { PostTags } from "./post-tags";

const render = (team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostTags workspaceId="workspace_test_1" post={postDetail} />
    </TeamRuntimeProvider>,
  );
const sentTags = async (api: ReturnType<typeof mockApi>) => {
  await waitFor(() => expect(api.calls("setQuillsPostTags")).toHaveLength(1));
  return api.calls("setQuillsPostTags")[0]!.clone().json();
};

describe("PostTags", () => {
  it("loads the tags when the menu opens and adds one", async () => {
    const api = mockApi();
    expect(api.calls()).toHaveLength(0);
    api.reply(inboxTags);
    api.reply(setPostTagsFixture.ok());
    const view = render();
    expect(view.getByText("API")).toBeVisible();
    press("Edit tags");
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "UX" }));
    await expect(sentTags(api)).resolves.toEqual({
      tagIds: ["tag_api", "tag_ux"],
    });
  });

  it("removes a tag from its chip", async () => {
    const api = mockApi();
    api.reply(setPostTagsFixture.ok());
    render();
    press("Remove the tag API");
    await expect(sentTags(api)).resolves.toEqual({ tagIds: [] });
  });

  it("creates a tag and adds it to the request", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    api.reply(createTagFixture.ok({ id: "tag_new", name: "Billing" }));
    const view = render();
    press("Edit tags");
    fireEvent.click(await view.findByRole("menuitem", { name: "Create tag" }));
    await view.findByRole("dialog");
    fill("Name", "Billing");
    // The new tag refreshes the tag list before the request gets it.
    api.reply(inboxTags);
    api.reply(setPostTagsFixture.ok());
    fireEvent.click(view.getByRole("button", { name: "Create" }));
    await expect(sentTags(api)).resolves.toEqual({
      tagIds: ["tag_api", "tag_new"],
    });
    await expect(
      api.calls("createQuillsTag")[0]!.clone().json(),
    ).resolves.toEqual({ name: "Billing" });
  });

  it("offers Create tag only with the settings permission, and no remove without update", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    const view = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, manageSettings: false },
    });
    press("Edit tags");
    await view.findByRole("menuitemcheckbox", { name: "UX" });
    expect(view.queryByRole("menuitem", { name: "Create tag" })).toBeNull();
    view.unmount();
    mockApi();
    const reader = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false },
    });
    expect(
      reader.queryByRole("button", { name: "Remove the tag API" }),
    ).toBeNull();
    expect(reader.queryByRole("button", { name: "Edit tags" })).toBeNull();
  });
});
