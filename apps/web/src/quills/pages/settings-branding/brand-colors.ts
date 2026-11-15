import type { GetBrandingSettingsResponse } from "../../api/team/get-branding-settings";

type Theme = GetBrandingSettingsResponse["theme"];
type Pair = { primary: string; primaryForeground: string };

const white = "#ffffff";
const pair = (primary: string, primaryForeground = white): Pair => ({
  primary,
  primaryForeground,
});

/**
 * The named primary colors of the portal theme: the Tailwind colors of the dots, as hex
 * values. The widget config passes on only hex colors, so an OKLCH value would remove the
 * brand color from the widget launcher. `dot` is the class of the color dot in the select.
 */
export const brandColors = [
  {
    id: "blue",
    labelKey: "settings-workspace.branding.colors.blue",
    dot: "bg-blue-600",
    light: pair("#155dfc"),
    dark: pair("#2b7fff"),
  },
  {
    id: "violet",
    labelKey: "settings-workspace.branding.colors.violet",
    dot: "bg-violet-600",
    light: pair("#7f22fe"),
    dark: pair("#8e51ff"),
  },
  {
    id: "pink",
    labelKey: "settings-workspace.branding.colors.pink",
    dot: "bg-pink-600",
    light: pair("#e60076"),
    dark: pair("#f6339a"),
  },
  {
    id: "red",
    labelKey: "settings-workspace.branding.colors.red",
    dot: "bg-red-600",
    light: pair("#e7000b"),
    dark: pair("#fb2c36"),
  },
  {
    id: "orange",
    labelKey: "settings-workspace.branding.colors.orange",
    dot: "bg-orange-600",
    light: pair("#f54900"),
    dark: pair("#ff6900"),
  },
  {
    id: "green",
    labelKey: "settings-workspace.branding.colors.green",
    dot: "bg-green-600",
    light: pair("#008236"),
    dark: pair("#00a63e"),
  },
  {
    id: "teal",
    labelKey: "settings-workspace.branding.colors.teal",
    dot: "bg-teal-600",
    light: pair("#00786f"),
    dark: pair("#009689"),
  },
  {
    id: "black",
    labelKey: "settings-workspace.branding.colors.black",
    dot: "bg-neutral-900 dark:bg-neutral-100",
    light: pair("#171717"),
    dark: pair("#e5e5e5", "#171717"),
  },
] as const;

/** The named color of the theme, or null for a color that was set in another way. */
export function colorOf(theme: Theme): string | null {
  return (
    brandColors.find((color) => color.light.primary === theme.light?.primary)
      ?.id ?? null
  );
}

/**
 * The theme with a new primary color. The API replaces the whole theme on a write, so
 * every other key keeps its stored value.
 */
export function withColor(theme: Theme, id: string): Theme {
  const color = brandColors.find((item) => item.id === id);
  if (!color) return theme;
  return {
    ...theme,
    light: { ...theme.light, ...color.light },
    dark: { ...theme.dark, ...color.dark },
  };
}
