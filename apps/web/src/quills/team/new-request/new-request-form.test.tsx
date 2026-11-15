import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose, fill, press } from "../../test/actions";
import { describeFormContract } from "../../test/contracts";
import { renderComponent } from "../../test/render";
import {
  inboxBoards,
  inboxStatuses,
  inboxTags,
} from "../../pages/team-posts/inbox.fixture";
import { NewRequestForm, type NewRequestFormProps } from "./new-request-form";

const render = (props: Partial<NewRequestFormProps> = {}) => {
  const onSubmit = vi.fn(async () => undefined);
  const view = renderComponent(
    <NewRequestForm
      boards={inboxBoards.items}
      statuses={inboxStatuses.statuses}
      tags={inboxTags.tags}
      author={null}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { view, onSubmit };
};

describe("NewRequestForm", () => {
  describeFormContract({
    render: (onSubmit) => render({ onSubmit }).view,
    fieldName: "Request title",
    issuePath: "title",
    submitName: "Create",
    validValue: "Dark mode",
    invalidValue: "   ",
    // The first board and the default status.
    expectedValues: {
      boardId: "board_ideas",
      title: "Dark mode",
      content: "",
      statusId: "status_open",
      tagIds: [],
    },
  });

  it("explains that no board exists", async () => {
    const { view, onSubmit } = render({ boards: [] });
    fill("Request title", "Dark mode");
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "No board exists. Add a board in Settings first.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("asks for a board when the board of the filter is missing", async () => {
    const { view, onSubmit } = render({ boardId: "board_deleted" });
    fill("Request title", "Dark mode");
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent("Choose a board.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("caps the details at 10,000 characters and says so at the limit", async () => {
    const { view, onSubmit } = render();
    expect(view.getByLabelText("Add details")).toHaveAttribute(
      "maxlength",
      "10000",
    );
    fill("Request title", "Dark mode");
    // A long paste stops at the limit; the limit then shows before a submit.
    fill("Add details", "a".repeat(10000));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Details can have at most 10,000 characters.",
    );
    press("Create");
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it("refuses details over 10,000 characters", async () => {
    const { view, onSubmit } = render();
    fill("Request title", "Dark mode");
    fill("Add details", "a".repeat(10001));
    press("Create");
    await waitFor(() =>
      expect(view.getByLabelText("Add details")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("starts on the given status", async () => {
    const { view, onSubmit } = render({ defaultStatusId: "status_planned" });
    expect(view.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Planned",
    );
    fill("Request title", "Dark mode");
    press("Create");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ statusId: "status_planned" }),
      ),
    );
  });

  it("sends the status and the tags chosen in their menus", async () => {
    const { view, onSubmit } = render();
    fill("Request title", "Dark mode");
    await choose("Status", "Complete");
    fireEvent.click(view.getByRole("button", { name: "Tags" }));
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: "UX" }));
    expect(view.getByRole("button", { name: "1 tag" })).toBeVisible();
    press("Create");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: "status_done",
          tagIds: ["tag_ux"],
        }),
      ),
    );
  });

  it("sends the form on Cmd+Enter or Ctrl+Enter in a text field", async () => {
    const { view, onSubmit } = render();
    fill("Request title", "Dark mode");
    fireEvent.keyDown(view.getByLabelText("Add details"), {
      key: "Enter",
      metaKey: true,
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    fireEvent.keyDown(view.getByLabelText("Request title"), {
      key: "Enter",
      ctrlKey: true,
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });
});
