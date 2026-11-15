import { describe, expect, it } from "vite-plus/test";
import type { TeamNavSection } from "./nav";
import { filterSettingsNav } from "./filter-settings-nav";

const labels: Record<string, string> = {
  personal: "Personal",
  account: "Account",
  connections: "Connections",
  api: "API",
  data: "Data & Import",
};
const sections: TeamNavSection[] = [
  {
    id: "personal",
    labelKey: "personal",
    items: [{ id: "account", labelKey: "account", to: "/account" }],
  },
  {
    id: "connections",
    labelKey: "connections",
    items: [
      { id: "api", labelKey: "api", to: "/api" },
      { id: "data", labelKey: "data", to: "/data" },
    ],
  },
];
const search = (query: string) =>
  filterSettingsNav(sections, query, (key) => labels[key] ?? key).map(
    (section) => [section.id, section.items.map((item) => item.id)],
  );

describe("filterSettingsNav", () => {
  it("keeps every section for an empty search", () => {
    expect(search("  ")).toEqual([
      ["personal", ["account"]],
      ["connections", ["api", "data"]],
    ]);
  });

  it("matches item labels without letter case and hides sections without a match", () => {
    expect(search(" IMPORT")).toEqual([["connections", ["data"]]]);
  });

  it("keeps all items of a section whose label matches", () => {
    expect(search("connect")).toEqual([["connections", ["api", "data"]]]);
  });

  it("returns nothing when nothing matches", () => {
    expect(search("billing")).toEqual([]);
  });
});
