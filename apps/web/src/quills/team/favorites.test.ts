import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderQuillsHook } from "../test/render";
import { readFavorites, useFavorites } from "./favorites";

describe("useFavorites", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stars and unstars a view per workspace on this browser", () => {
    const view = renderQuillsHook(() => useFavorites("workspace_1"), {});
    act(() =>
      view.result.current[1]("/feedback/workspace_1/roadmap", "Roadmap"),
    );
    expect(view.result.current[0]).toEqual([
      { path: "/feedback/workspace_1/roadmap", label: "Roadmap" },
    ]);
    expect(readFavorites("workspace_1")).toHaveLength(1);
    expect(readFavorites("workspace_2")).toEqual([]);
    act(() =>
      view.result.current[1]("/feedback/workspace_1/roadmap", "Roadmap"),
    );
    expect(view.result.current[0]).toEqual([]);
  });

  it("reads broken or blocked storage as no stars", () => {
    window.localStorage.setItem("quills.favorites.workspace_1", '[{"path":1}]');
    expect(readFavorites("workspace_1")).toEqual([]);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    expect(readFavorites("workspace_1")).toEqual([]);
  });
});
