import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../test/actions";
import { renderComponent } from "../test/render";
import { SettingSelect } from "./setting-select";
import { toast } from "./upstream";

const options = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;

describe("SettingSelect", () => {
  it("saves the chosen value", async () => {
    const onValueChange = vi.fn(async () => undefined);
    renderComponent(
      <SettingSelect
        label="Portal visibility"
        value="public"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    await choose("Portal visibility", "Private");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("private"));
  });

  it("moves back and says why when the save fails", async () => {
    const error = vi.spyOn(toast, "error");
    const view = renderComponent(
      <SettingSelect
        label="Portal visibility"
        value="public"
        options={options}
        onValueChange={() => Promise.reject({ kind: "noAccess" })}
      />,
    );
    await choose("Portal visibility", "Private");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "You do not have permission to change this setting.",
      ),
    );
    await waitFor(() =>
      expect(
        view.getByRole("combobox", { name: "Portal visibility" }),
      ).toHaveTextContent("Public"),
    );
  });

  it("shows the placeholder for a stored value that is not an option", () => {
    const view = renderComponent(
      <SettingSelect
        label="Primary color"
        value={null}
        placeholder="Custom"
        options={[{ value: "red", label: "Red", dot: "bg-red-600" }]}
        onValueChange={async () => undefined}
      />,
    );
    expect(
      view.getByRole("combobox", { name: "Primary color" }),
    ).toHaveTextContent("Custom");
  });

  it("shows the color dot of an option", () => {
    const view = renderComponent(
      <SettingSelect
        label="Primary color"
        value="red"
        options={[{ value: "red", label: "Red", dot: "bg-red-600" }]}
        onValueChange={async () => undefined}
      />,
    );
    const select = view.getByRole("combobox", { name: "Primary color" });
    expect(select).toHaveTextContent("Red");
    expect(select.querySelector(".bg-red-600")).not.toBeNull();
  });
});
