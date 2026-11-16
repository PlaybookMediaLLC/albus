import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderQuillsHook } from "../test/render";
import { useUserPreferencesStore } from "../ui/upstream";
import { useDarkTheme } from "./use-dark-theme";

describe("useDarkTheme", () => {
  afterEach(() => {
    useUserPreferencesStore.setState({ theme: "dark" });
    vi.unstubAllGlobals();
  });

  it("follows a change of the theme store", () => {
    useUserPreferencesStore.setState({ theme: "light" });
    const { result } = renderQuillsHook(() => useDarkTheme(), {
      initialProps: {},
    });
    expect(result.current).toBe(false);
    act(() => useUserPreferencesStore.setState({ theme: "dark" }));
    expect(result.current).toBe(true);
  });

  it("reads the device setting for the system theme", () => {
    vi.stubGlobal("matchMedia", (media: string) => ({
      matches: true,
      media,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    useUserPreferencesStore.setState({ theme: "system" });
    const { result } = renderQuillsHook(() => useDarkTheme(), {
      initialProps: {},
    });
    expect(result.current).toBe(true);
  });

  it("follows a device theme change for the system theme", () => {
    let dark = false;
    let notify = () => {};
    vi.stubGlobal("matchMedia", (media: string) => ({
      get matches() {
        return dark;
      },
      media,
      addEventListener: (_: string, listener: () => void) => {
        notify = listener;
      },
      removeEventListener: () => {},
    }));
    useUserPreferencesStore.setState({ theme: "system" });
    const { result } = renderQuillsHook(() => useDarkTheme(), {
      initialProps: {},
    });
    expect(result.current).toBe(false);
    act(() => {
      dark = true;
      notify();
    });
    expect(result.current).toBe(true);
  });
});
