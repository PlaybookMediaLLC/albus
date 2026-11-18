import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { readDisplay, useCardDisplay } from "./card-display";

describe("useCardDisplay", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows every detail at first and keeps a change per workspace", () => {
    const view = renderQuillsHook(() => useCardDisplay("workspace_1"), {});
    expect(view.result.current[0]).toEqual({
      board: true,
      author: true,
      counts: true,
      created: true,
    });
    act(() => view.result.current[1]("created", false));
    expect(view.result.current[0].created).toBe(false);
    expect(readDisplay("workspace_1").created).toBe(false);
    expect(readDisplay("workspace_2").created).toBe(true);
  });

  it("shows every detail when the stored value is broken or storage is blocked", () => {
    window.localStorage.setItem("quills.roadmap-display.workspace_1", "{oops");
    expect(readDisplay("workspace_1").board).toBe(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    expect(readDisplay("workspace_1").counts).toBe(true);
  });
});
