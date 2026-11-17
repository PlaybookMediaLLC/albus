import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { AcceptPostForm } from "./accept-post-form";
describe("AcceptPostForm", () => {
  describeFormContract({
    render: (onSubmit) =>
      renderComponent(
        <AcceptPostForm
          boards={[{ id: "board_test_1", name: "Ideas" }]}
          title=""
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Post title",
    issuePath: "title",
    submitName: "Create post",
    validValue: "Dark theme",
    expectedValues: {
      boardId: "board_test_1",
      title: "Dark theme",
      customFields: {},
    },
    invalidValue: " ",
  });

  it("asks for the board's required fields, internal ones included, and sends typed values", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <AcceptPostForm
        boards={[
          {
            id: "board_test_1",
            name: "Ideas",
            fields: [
              { key: "mrr", label: "MRR", type: "number", required: true },
            ],
          },
        ]}
        title="Dark theme"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: "Create post" }));
    expect(await view.findByText("MRR is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(view.getByLabelText("MRR (required)"), {
      target: { value: "1200" },
    });
    fireEvent.click(view.getByRole("button", { name: "Create post" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        boardId: "board_test_1",
        title: "Dark theme",
        customFields: { mrr: 1200 },
      }),
    );
  });
});
