import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { readHidden, useGetStartedHidden } from "./get-started-hidden";

describe("useGetStartedHidden", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps the hidden cards per workspace on this browser", () => {
    const { result } = renderQuillsHook(
      () => useGetStartedHidden("workspace_1"),
      {},
    );
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    expect(readHidden("workspace_1")).toBe(true);
    expect(readHidden("workspace_2")).toBe(false);
  });

  it("shows the cards and still hides them when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderQuillsHook(
      () => useGetStartedHidden("workspace_1"),
      {},
    );
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });
});
