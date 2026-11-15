import { describe, expect, it } from "vite-plus/test";
import { navEnabled, withNavItem, type PortalNavItem } from "./portal-nav";

const item = (overrides: Partial<PortalNavItem>): PortalNavItem => ({
  id: "feedback",
  type: "feedback",
  enabled: true,
  label: null,
  url: null,
  newTab: true,
  ...overrides,
});

const nav = [
  item({}),
  item({ id: "roadmap", type: "roadmap", label: "Plans" }),
  item({
    id: "docs",
    type: "link",
    label: "Docs",
    url: "https://example.test/docs",
    newTab: false,
  }),
];

describe("navEnabled", () => {
  it("reads the stored tab, and shows a tab that the list does not name", () => {
    expect(
      navEnabled([item({ type: "roadmap", enabled: false })], "roadmap"),
    ).toBe(false);
    expect(navEnabled([], "changelog")).toBe(true);
  });
});

describe("withNavItem", () => {
  it("changes only the chosen tab and keeps every other stored value", () => {
    expect(withNavItem(nav, "roadmap", false)).toEqual([
      { id: "feedback", type: "feedback", enabled: true },
      { id: "roadmap", type: "roadmap", enabled: false, label: "Plans" },
      {
        id: "docs",
        type: "link",
        enabled: true,
        label: "Docs",
        url: "https://example.test/docs",
        newTab: false,
      },
    ]);
  });

  it("adds the tab when the stored list does not name it", () => {
    expect(withNavItem([], "changelog", false)).toEqual([
      { id: "changelog", type: "changelog", enabled: false },
    ]);
  });
});
