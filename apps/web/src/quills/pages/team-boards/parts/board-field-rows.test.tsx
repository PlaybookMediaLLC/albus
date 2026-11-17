import { useForm } from "react-hook-form";
import { describe, expect, it } from "vite-plus/test";
import { choose, press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import type { FieldRow } from "../board-fields";
import { BoardFieldRows } from "./board-field-rows";

function Rows({ fields }: { fields: FieldRow[] }) {
  const form = useForm<{ customFields: FieldRow[] }>({
    defaultValues: { customFields: fields },
  });
  return <BoardFieldRows form={form} />;
}

describe("BoardFieldRows", () => {
  it("asks for options only for a select field, and removes a row", async () => {
    const view = renderComponent(
      <Rows
        fields={[
          {
            key: "plan",
            label: "Plan",
            type: "text",
            required: false,
            internal: false,
            options: "",
          },
        ]}
      />,
    );
    expect(view.queryByLabelText("Options")).toBeNull();
    await choose("Type", "Multi-select");
    expect(await view.findByLabelText("Options")).toBeInTheDocument();
    press("Remove field Plan");
    expect(
      view.getByText("This board asks for no custom fields."),
    ).toBeInTheDocument();
  });

  it("stops at 20 fields", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      key: `f${i}`,
      label: `F${i}`,
      type: "text" as const,
      required: false,
      internal: false,
      options: "",
    }));
    const view = renderComponent(<Rows fields={many} />);
    expect(view.getByRole("button", { name: "Add field" })).toBeDisabled();
  });
});
