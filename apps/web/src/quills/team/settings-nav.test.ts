import { describe, expect, it } from "vite-plus/test";
import { ensureQuillsI18n } from "../i18n/load";
import { i18n } from "../ui/upstream";
import { settingsSections } from "./settings-nav";

const ids = (sections: ReturnType<typeof settingsSections>) =>
  sections.flatMap((section) => section.items.map((item) => item.id));
const off = {
  feedback: false,
  changelog: false,
  helpCenter: false,
  supportInbox: false,
};

describe("settingsSections", () => {
  it("lists every section and item with a translated label while the settings load", async () => {
    await ensureQuillsI18n();
    const sections = settingsSections("workspace 1");
    expect(sections.map((section) => section.id)).toEqual([
      "personal",
      "workspace",
      "product",
      "conversations",
      "connections",
    ]);
    const items = sections.flatMap((section) => section.items);
    expect(items).toHaveLength(20);
    expect(new Set(ids(sections)).size).toBe(items.length);
    for (const key of [
      ...sections.map((section) => section.labelKey),
      ...items.map((item) => item.labelKey ?? ""),
    ])
      expect(i18n.exists(key, { ns: "quills" })).toBe(true);
    expect(items.find((item) => item.id === "general")?.to).toBe(
      "/feedback/workspace%201/settings/conversations/general",
    );
  });

  it("hides the items of the modules that are off and keeps a section with items", () => {
    const sections = settingsSections("workspace_1", off, true);
    expect(ids(sections)).toEqual([
      "account",
      "branding",
      "domain",
      "team",
      "billing",
      "privacy",
      "login",
      "widget",
      "moderation",
      "integrations",
      "api",
      "data",
    ]);
  });

  it("hides Billing when the instance does not bill workspaces", () => {
    expect(ids(settingsSections("workspace_1", {}, false))).not.toContain(
      "billing",
    );
  });
});
