import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { LanguageRow } from "./language-row";

const open = async (view: ReturnType<typeof renderComponent>, item: string) => {
  fireEvent.click(view.getByRole("button", { name: "Actions for German" }));
  fireEvent.click(await view.findByRole("menuitem", { name: item }));
};

describe("LanguageRow", () => {
  it("shows the name and the code, and edits the text", async () => {
    const onEdit = vi.fn();
    const view = renderComponent(
      <LanguageRow
        locale="de"
        name="German"
        onEdit={onEdit}
        onRemove={vi.fn()}
      />,
    );
    expect(view.getByText("German")).toBeInTheDocument();
    expect(view.getByText("de")).toBeInTheDocument();
    await open(view, "Edit homepage text");
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("shows a toast when the removal fails", async () => {
    const error = vi.spyOn(toast, "error");
    const view = renderComponent(
      <LanguageRow
        locale="de"
        name="German"
        onEdit={vi.fn()}
        onRemove={() => Promise.reject({ kind: "failed" })}
      />,
    );
    await open(view, "Remove");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("Something went wrong. Try again."),
    );
  });

  it("has no actions without the permission", () => {
    const view = renderComponent(
      <LanguageRow
        locale="de"
        name="German"
        disabled
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      view.queryByRole("button", { name: "Actions for German" }),
    ).toBeNull();
  });
});
