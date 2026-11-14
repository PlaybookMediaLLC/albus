import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { CreatePostForm } from "./create-post-form";

const boards = [
  { id: "board_1", name: "Ideas" },
  { id: "board_2", name: "Bugs" },
];

describe("CreatePostForm", () => {
  describeFormContract({
    render: (onSubmit) =>
      renderComponent(
        <CreatePostForm
          boards={boards}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      ),
    fieldName: "Request title",
    issuePath: "title",
    submitName: "Create request",
    validValue: "Faster export",
    expectedValues: { boardId: "board_1", title: "Faster export", content: "" },
    invalidValue: " ",
  });

  it("needs a title and sends the board, title and details", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <CreatePostForm boards={boards} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );
    expect(view.getByRole("combobox", { name: "Board" })).toHaveTextContent(
      "Ideas",
    );
    press("Create request");
    expect(await view.findByLabelText("Request title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    fill("Request title", "Faster export");
    fill("Details (optional)", "Asked in support.");
    press("Create request");
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        boardId: "board_1",
        title: "Faster export",
        content: "Asked in support.",
      }),
    );
  });

  it("explains that no board exists", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <CreatePostForm boards={[]} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );
    fill("Request title", "Faster export");
    press("Create request");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "No board exists. Add a board in Settings first.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("caps the details at 10,000 characters", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <CreatePostForm boards={boards} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );
    expect(view.getByLabelText("Details (optional)")).toHaveAttribute(
      "maxlength",
      "10000",
    );
    fill("Request title", "Faster export");
    fill("Details (optional)", "a".repeat(10001));
    press("Create request");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Use 10,000 characters or fewer.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
