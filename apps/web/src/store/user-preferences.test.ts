import { afterEach, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
  vi.resetModules();
});

const loadTheme = async () =>
  (await import("./user-preferences")).useUserPreferencesStore.getState().theme;

it("keeps the dark default in the Kaneo app", async () => {
  expect(await loadTheme()).toBe("dark");
});

it("follows the device on a first portal visit", async () => {
  window.history.replaceState(null, "", "/portal/workspace_1");
  expect(await loadTheme()).toBe("system");
});

it("keeps a stored choice on the portal", async () => {
  window.history.replaceState(null, "", "/portal/workspace_1");
  localStorage.setItem(
    "user-preferences",
    JSON.stringify({ state: { theme: "light" }, version: 0 }),
  );
  expect(await loadTheme()).toBe("light");
});
