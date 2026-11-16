import { describe, expect, it } from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { useArrived } from "./use-arrived";

type Props = { ids: string[]; scope: string };

describe("useArrived", () => {
  it("marks only ids after the newest one of the first render", () => {
    const view = renderQuillsHook(
      ({ ids, scope }: Props) => useArrived(ids, scope),
      {
        initialProps: { ids: ["message_2"], scope: "conversation_1" },
      },
    );
    expect(view.result.current("message_2")).toBe(false);
    view.rerender({
      ids: ["message_1", "message_2", "message_3"],
      scope: "conversation_1",
    });
    // message_1 is older history loaded above; only message_3 arrived.
    expect(view.result.current("message_1")).toBe(false);
    expect(view.result.current("message_3")).toBe(true);
  });

  it("starts again for a new scope", () => {
    const view = renderQuillsHook(
      ({ ids, scope }: Props) => useArrived(ids, scope),
      {
        initialProps: { ids: ["message_1"], scope: "conversation_1" },
      },
    );
    view.rerender({ ids: ["message_9"], scope: "conversation_2" });
    expect(view.result.current("message_9")).toBe(false);
    view.rerender({
      ids: ["message_9", "message_10"],
      scope: "conversation_2",
    });
    expect(view.result.current("message_10")).toBe(true);
  });

  it("fades the first messages of a thread that started empty", () => {
    const view = renderQuillsHook(
      ({ ids, scope }: Props) => useArrived(ids, scope),
      {
        initialProps: { ids: [] as string[], scope: "conversation_1" },
      },
    );
    view.rerender({ ids: ["message_1"], scope: "conversation_1" });
    expect(view.result.current("message_1")).toBe(true);
  });
});
