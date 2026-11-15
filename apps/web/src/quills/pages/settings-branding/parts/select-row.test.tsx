import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { SelectRow } from "./select-row";

const options = [
  { value: "s", label: "Small" },
  { value: "l", label: "Large", dot: "bg-red-600" },
];

describe("SelectRow", () => {
  it("shows the chosen value at once while it saves", async () => {
    let finish!: () => void;
    const onValueChange = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const view = renderComponent(
      <SelectRow
        title="Size"
        value="s"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    await choose("Size", "Large");
    expect(onValueChange).toHaveBeenCalledWith("l");
    expect(view.getByRole("combobox", { name: "Size" })).toHaveTextContent(
      "Large",
    );
    finish();
  });

  it("moves back and shows a toast when the save fails", async () => {
    const error = vi.spyOn(toast, "error");
    const view = renderComponent(
      <SelectRow
        title="Size"
        value="s"
        options={options}
        onValueChange={() => Promise.reject({ kind: "failed" })}
      />,
    );
    await choose("Size", "Large");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("Something went wrong. Try again."),
    );
    expect(view.getByRole("combobox", { name: "Size" })).toHaveTextContent(
      "Small",
    );
  });

  it("shows the placeholder for a stored value that is not an option", () => {
    const view = renderComponent(
      <SelectRow
        title="Size"
        value="xl"
        placeholder="Custom"
        options={options}
        onValueChange={async () => undefined}
      />,
    );
    expect(view.getByRole("combobox", { name: "Size" })).toHaveTextContent(
      "Custom",
    );
  });
});
