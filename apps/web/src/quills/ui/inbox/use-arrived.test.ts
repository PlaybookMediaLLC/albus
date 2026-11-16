import { describe, expect, it } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { useArrived } from "./use-arrived";

describe("useArrived", () => {
  it("marks only ids that come after the first render, and starts again for a new scope", () => {
    const view = renderQuillsHook(
      ({ ids, scope }: { ids: string[]; scope: string }) =>
        useArrived(ids, scope),
      { initialProps: { ids: ["message_1"], scope: "conversation_1" } },
    );
    expect(view.result.current("message_1")).toBe(false);
    view.rerender({ ids: ["message_1", "message_2"], scope: "conversation_1" });
    expect(view.result.current("message_2")).toBe(true);
    view.rerender({ ids: ["message_3"], scope: "conversation_2" });
    expect(view.result.current("message_3")).toBe(false);
  });
});
