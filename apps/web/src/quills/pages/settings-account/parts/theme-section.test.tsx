import { afterEach, describe, expect, it } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { useUserPreferencesStore } from "../../../ui/upstream";
import { ThemeSection } from "./theme-section";

describe("ThemeSection", () => {
  afterEach(() => useUserPreferencesStore.getState().setTheme("system"));

  it("shows the stored theme and stores the chosen one", async () => {
    useUserPreferencesStore.getState().setTheme("light");
    const view = renderComponent(<ThemeSection />);
    expect(view.getByRole("combobox", { name: "Theme" })).toHaveTextContent(
      "Light",
    );
    await choose("Theme", "Dark");
    expect(useUserPreferencesStore.getState().theme).toBe("dark");
  });
});
