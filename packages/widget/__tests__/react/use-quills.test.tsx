import { describe, it, expect } from "vite-plus/test";
import { renderHook } from "@testing-library/react";
import { useQuills } from "../../src/react/use-quills";
import Quills from "../../src";
import * as react from "../../src/react";

describe("useQuills", () => {
  it("returns the Quills singleton", () => {
    const { result } = renderHook(() => useQuills());
    expect(result.current).toBe(Quills);
    expect(typeof result.current.open).toBe("function");
    expect(typeof result.current.identify).toBe("function");
  });
});

describe("the React names before the rename", () => {
  it("keeps the Quackback hooks and export as aliases", () => {
    expect(react.useQuackbackInit).toBe(react.useQuillsInit);
    expect(react.useQuackback).toBe(react.useQuills);
    expect(react.useQuackbackEvent).toBe(react.useQuillsEvent);
    expect(react.Quackback).toBe(Quills);
    expect(react.Quills).toBe(Quills);
  });
});
