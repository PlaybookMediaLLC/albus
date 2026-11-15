import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import {
  readCollapsed,
  useCollapsedColumns,
  writeCollapsed,
} from "./collapsed-columns";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("collapsed columns", () => {
  it("keeps the collapsed columns of each workspace on this device", () => {
    expect(readCollapsed("workspace_1")).toEqual([]);
    writeCollapsed("workspace_1", ["status_open"]);
    expect(readCollapsed("workspace_1")).toEqual(["status_open"]);
    expect(readCollapsed("workspace_2")).toEqual([]);
  });

  it("reads broken or blocked storage as no collapsed column", () => {
    window.localStorage.setItem("quills.roadmap-collapsed.workspace_1", "{");
    expect(readCollapsed("workspace_1")).toEqual([]);
    window.localStorage.setItem(
      "quills.roadmap-collapsed.workspace_1",
      '["status_open", 3]',
    );
    expect(readCollapsed("workspace_1")).toEqual(["status_open"]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    expect(() => writeCollapsed("workspace_1", [])).not.toThrow();
  });

  it("toggles a column and keeps the choice", () => {
    const view = renderQuillsHook(() => useCollapsedColumns("workspace_1"), {});
    act(() => view.result.current[1]("status_open"));
    expect(view.result.current[0]).toEqual(["status_open"]);
    expect(readCollapsed("workspace_1")).toEqual(["status_open"]);
    act(() => view.result.current[1]("status_open"));
    expect(view.result.current[0]).toEqual([]);
  });
});
