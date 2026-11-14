import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { inboxBoards, inboxStatuses, inboxTags } from "../inbox.fixture";
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
    fieldName: "Submission title",
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
    fill("Submission title", "Dark mode");
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "No board exists. Add a board in Settings first.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("asks for a board when the board of the filter is missing", async () => {
    const { view, onSubmit } = render({ boardId: "board_deleted" });
    fill("Submission title", "Dark mode");
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent("Choose a board.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("caps the details at 10,000 characters", async () => {
    const { view, onSubmit } = render();
    expect(view.getByLabelText("Add details")).toHaveAttribute(
      "maxlength",
      "10000",
    );
    fill("Submission title", "Dark mode");
    fill("Add details", "a".repeat(10001));
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Use 10,000 characters or fewer.",
    );
    expect(view.getByLabelText("Add details")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
