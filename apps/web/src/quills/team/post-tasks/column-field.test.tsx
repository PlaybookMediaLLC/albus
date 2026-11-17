import { describe, expect, it } from "vite-plus/test";
import { useForm } from "react-hook-form";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { ColumnField } from "./column-field";

function Harness() {
  const form = useForm({
    defaultValues: {
      projectId: "project_web",
      columnId: null as string | null,
    },
  });
  return (
    <ColumnField form={form} label="Column" firstLabel="First open column" />
  );
}

describe("ColumnField", () => {
  it("lists the project's columns after the first open column", async () => {
    const api = mockApi();
    api.reply([
      { id: "column_todo", name: "To do" },
      { id: "column_done", name: "Done" },
    ]);
    const view = renderComponent(<Harness />);
    expect(view.getByRole("combobox", { name: "Column" })).toHaveTextContent(
      "First open column",
    );
    await view.findByRole("combobox", { name: "Column" });
    expect(new URL(api.calls()[0]!.url).pathname).toContain("project_web");
  });
});
