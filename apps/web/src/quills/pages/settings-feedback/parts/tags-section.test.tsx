import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listTagsFixture } from "../../../api/team/list-tags.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { TagsSection } from "./tags-section";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

const tag = {
  id: "tag_1",
  name: "security",
  color: "#ef4444",
  description: null,
  aiPrompt: null,
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <TagsSection workspaceId="workspace_1" tags={[tag]} />
    </TeamRuntimeProvider>,
  );

describe("TagsSection", () => {
  it("shows a name conflict at the field", async () => {
    mockApi().reply({ message: "A tag with this name exists" }, 409);
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "New tag" }));
    const dialog = await view.findByRole("dialog", { name: "New tag" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Security" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "A tag with this name exists.",
    );
  });

  it("deletes the tag of the row", async () => {
    const api = mockApi();
    api.reply({ id: "tag_1" });
    api.reply(listTagsFixture.ok());
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Actions for security" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete tag" }));
    const dialog = await view.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete tag" }));
    await waitFor(() => expect(api.calls("deleteQuillsTag")).toHaveLength(1));
    expect(new URL(api.calls("deleteQuillsTag")[0]!.url).pathname).toBe(
      "/api/quills/workspace_1/tags/tag_1",
    );
  });
});
