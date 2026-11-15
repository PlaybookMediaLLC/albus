import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { TraitDialog } from "./trait-dialog";

const definitions = [
  { key: "seats", label: "Seats", type: "number" as const },
  { key: "beta", label: "Beta", type: "boolean" as const },
];

describe("TraitDialog", () => {
  it("saves a typed value only when it fits the attribute", async () => {
    const onSave = vi.fn(async () => undefined);
    renderComponent(<TraitDialog definitions={definitions} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a trait" }));
    const save = await screen.findByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await choose("Attribute", "Seats");
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "abc" },
    });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "12" },
    });
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ seats: 12 }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("stays open when the save fails", async () => {
    const onSave = vi.fn(async () => {
      throw new Error("not saved");
    });
    renderComponent(<TraitDialog definitions={definitions} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a trait" }));
    await choose("Attribute", "Beta");
    fireEvent.click(await screen.findByRole("switch", { name: "Value" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ beta: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
