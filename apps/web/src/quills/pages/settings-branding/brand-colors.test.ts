import { describe, expect, it } from "vite-plus/test";
import { brandColors, colorOf, withColor } from "./brand-colors";

const stored = {
  preset: "custom",
  themeMode: "user" as const,
  light: { background: "oklch(0.99 0 0)", primary: "oklch(0.5 0.1 10)" },
  dark: { background: "oklch(0.2 0 0)" },
};

describe("brand colors", () => {
  it("changes only the primary keys and keeps every other stored key", () => {
    const next = withColor(stored, "red");
    const red = brandColors.find((color) => color.id === "red")!;
    expect(next).toEqual({
      preset: "custom",
      themeMode: "user",
      light: { background: "oklch(0.99 0 0)", ...red.light },
      dark: { background: "oklch(0.2 0 0)", ...red.dark },
    });
    expect(colorOf(next)).toBe("red");
  });
  it("gives null for a primary color that is not a named color", () => {
    expect(colorOf(stored)).toBeNull();
    expect(colorOf({})).toBeNull();
  });
  it("keeps the theme for an unknown color", () => {
    expect(withColor(stored, "plaid")).toBe(stored);
  });
  it("adds both maps when the stored theme has none", () => {
    const next = withColor({}, "blue");
    expect(next.light?.primary).toBe(brandColors[0].light.primary);
    expect(next.dark?.primaryForeground).toBe(
      brandColors[0].dark.primaryForeground,
    );
  });
});
