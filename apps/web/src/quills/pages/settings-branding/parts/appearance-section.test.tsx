import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { brandColors } from "../brand-colors";
import { AppearanceSection } from "./appearance-section";

const theme = {
  preset: "custom",
  light: {
    background: "oklch(0.99 0 0)",
    primary: brandColors[0].light.primary,
  },
  dark: { background: "oklch(0.2 0 0)" },
};

describe("AppearanceSection", () => {
  it("shows the named color and dynamic mode of an unset mode", () => {
    const view = renderComponent(
      <AppearanceSection theme={theme} onSave={vi.fn()} />,
    );
    expect(
      view.getByRole("combobox", { name: "Primary color" }),
    ).toHaveTextContent("Blue");
    expect(view.getByRole("combobox", { name: "Theme" })).toHaveTextContent(
      "Dynamic",
    );
  });

  it("saves the whole theme with a new color or a new mode", async () => {
    const onSave = vi.fn(async () => undefined);
    renderComponent(<AppearanceSection theme={theme} onSave={onSave} />);
    await choose("Primary color", "Red");
    const red = brandColors.find((color) => color.id === "red")!;
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...theme,
        light: { ...theme.light, ...red.light },
        dark: { ...theme.dark, ...red.dark },
      }),
    );
    await choose("Theme", "Dark");
    await waitFor(() =>
      expect(onSave).toHaveBeenLastCalledWith({ ...theme, themeMode: "dark" }),
    );
  });

  it("turns the other select off while a theme save runs", async () => {
    let finish = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const view = renderComponent(
      <AppearanceSection theme={theme} onSave={onSave} />,
    );
    await choose("Primary color", "Red");
    const mode = view.getByRole("combobox", { name: "Theme" });
    await waitFor(() => expect(mode).toHaveAttribute("data-disabled"));
    finish();
    await waitFor(() => expect(mode).not.toHaveAttribute("data-disabled"));
  });
});
