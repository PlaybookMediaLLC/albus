import { useContext } from "react";
import { describe, expect, it } from "vite-plus/test";
import { renderQuillsHook } from "../test/render";
import { TeamHeaderContext } from "./header-context";

describe("TeamHeaderContext", () => {
  it("gives no breadcrumb or star outside the team shell", () => {
    const view = renderQuillsHook(() => useContext(TeamHeaderContext), {});
    expect(view.result.current).toBeNull();
  });
});
