import { describe, expect, it } from "vite-plus/test";
import { shellMode } from "./shell-mode";

describe("shellMode", () => {
  it("shows the settings sidebar under /settings", () => {
    expect(shellMode("/feedback/workspace_1/settings")).toBe("settings");
    expect(shellMode("/feedback/workspace_1/settings/")).toBe("settings");
    expect(shellMode("/feedback/workspace_1/settings/conversations/ai")).toBe(
      "settings",
    );
    expect(shellMode("/Feedback/workspace_1/Settings/api")).toBe("settings");
  });

  it("shows no sidebar in the changelog editor", () => {
    expect(shellMode("/feedback/workspace_1/changelog/new")).toBe("focus");
    expect(shellMode("/feedback/workspace_1/changelog/entry_1/")).toBe("focus");
  });

  it("shows the app sidebar everywhere else", () => {
    for (const path of [
      "/feedback/workspace_1",
      "/feedback/workspace_1/changelog",
      "/feedback/workspace_1/changelog/entry_1/history",
      "/feedback/workspace_1/settings-old",
      "/feedback/settings",
      "/feedback/workspace_1/posts/post_1",
    ])
      expect(shellMode(path)).toBe("app");
  });
});
