import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { BoardFieldsForm } from "./board-fields-form";

describe("BoardFieldsForm", () => {
  describeFormContract({
    render: (onSubmit) =>
      renderComponent(
        <BoardFieldsForm
          fields={[
            {
              key: "plan",
              label: "Plan",
              type: "text",
              required: false,
              internal: false,
            },
          ]}
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Label",
    issuePath: "customFields.0.label",
    submitName: "Save fields",
    validValue: "Plan tier",
    invalidValue: "",
    expectedValues: [
      {
        key: "plan",
        label: "Plan tier",
        type: "text",
        required: false,
        internal: false,
      },
    ],
  });

  it("saves the fields with keys made from the labels", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <BoardFieldsForm fields={[]} onSubmit={onSubmit} />,
    );
    expect(
      view.getByText("This board asks for no custom fields."),
    ).toBeInTheDocument();
    press("Add field");
    fireEvent.change(view.getByLabelText("Label"), {
      target: { value: "Company size" },
    });
    press("Save fields");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith([
        {
          key: "company_size",
          label: "Company size",
          type: "text",
          required: false,
          internal: false,
        },
      ]),
    );
  });

  it("refuses a field without a label", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <BoardFieldsForm fields={[]} onSubmit={onSubmit} />,
    );
    press("Add field");
    press("Save fields");
    await waitFor(() =>
      expect(view.getByLabelText("Label")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
