import type { GetBrandingSettingsResponse } from "../../api/team/get-branding-settings";

type Theme = GetBrandingSettingsResponse["theme"];
type Pair = { primary: string; primaryForeground: string };

const white = "oklch(1 0 0)";
const pair = (primary: string, primaryForeground = white): Pair => ({
  primary,
  primaryForeground,
});

/**
 * The named primary colors of the portal theme. The values are CSS colors, because the
 * portal, the widget and the mail use them outside the app's own styles. `dot` is the
 * class of the color dot in the select.
 */
export const brandColors = [
  {
    id: "blue",
    labelKey: "settings-workspace.branding.colors.blue",
    dot: "bg-blue-600",
    light: pair("oklch(0.546 0.245 262.881)"),
    dark: pair("oklch(0.623 0.214 259.815)"),
  },
  {
    id: "violet",
    labelKey: "settings-workspace.branding.colors.violet",
    dot: "bg-violet-600",
    light: pair("oklch(0.541 0.281 293.009)"),
    dark: pair("oklch(0.606 0.25 292.717)"),
  },
  {
    id: "pink",
    labelKey: "settings-workspace.branding.colors.pink",
    dot: "bg-pink-600",
    light: pair("oklch(0.592 0.249 0.584)"),
    dark: pair("oklch(0.656 0.241 354.308)"),
  },
  {
    id: "red",
    labelKey: "settings-workspace.branding.colors.red",
    dot: "bg-red-600",
    light: pair("oklch(0.577 0.245 27.325)"),
    dark: pair("oklch(0.637 0.237 25.331)"),
  },
  {
    id: "orange",
    labelKey: "settings-workspace.branding.colors.orange",
    dot: "bg-orange-600",
    light: pair("oklch(0.646 0.222 41.116)"),
    dark: pair("oklch(0.705 0.213 47.604)"),
  },
  {
    id: "green",
    labelKey: "settings-workspace.branding.colors.green",
    dot: "bg-green-600",
    light: pair("oklch(0.527 0.154 150.069)"),
    dark: pair("oklch(0.627 0.194 149.214)"),
  },
  {
    id: "teal",
    labelKey: "settings-workspace.branding.colors.teal",
    dot: "bg-teal-600",
    light: pair("oklch(0.511 0.096 186.391)"),
    dark: pair("oklch(0.6 0.118 184.704)"),
  },
  {
    id: "black",
    labelKey: "settings-workspace.branding.colors.black",
    dot: "bg-neutral-900 dark:bg-neutral-100",
    light: pair("oklch(0.205 0 0)"),
    dark: pair("oklch(0.922 0 0)", "oklch(0.205 0 0)"),
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
