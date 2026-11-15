import { act } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { renderQuillsHook } from "../../test/render";
import { useAutosave } from "./use-autosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const settle = () => act(() => vi.advanceTimersByTimeAsync(1000));

describe("useAutosave", () => {
  it("saves once, 1 s after the last change", async () => {
    const save = vi.fn(async () => true);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "a" },
    });
    view.rerender({ value: "ab" });
    await act(() => vi.advanceTimersByTimeAsync(500));
    view.rerender({ value: "abc" });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(save).not.toHaveBeenCalled();
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abc");
    expect(view.result.current.state).toBe("saved");
  });

  it("runs a change during a save after it, and retries a failure", async () => {
    let finish!: () => void;
    const save = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finish = () => resolve(true))),
      )
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(true);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "a" },
    });
    view.rerender({ value: "b" });
    await settle();
    expect(view.result.current.state).toBe("saving");
    view.rerender({ value: "c" });
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("c");
    expect(view.result.current.state).toBe("failed");
    await act(() => view.result.current.retry());
    expect(save).toHaveBeenCalledTimes(3);
    expect(view.result.current.state).toBe("saved");
  });

  it("keeps the value unsaved when save says there is nothing to save yet", async () => {
    const save = vi.fn(async () => false);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "" },
    });
    view.rerender({ value: " " });
    await settle();
    expect(view.result.current.state).toBe("unsaved");
    view.rerender({ value: "x" });
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("sends a pending change at once when the editor closes", async () => {
    const save = vi.fn(async () => true);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "a" },
    });
    view.rerender({ value: "ab" });
    view.unmount();
    expect(save).toHaveBeenCalledWith("ab");
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flushes before the delay and waits for a running save", async () => {
    let finish!: () => void;
    const save = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finish = () => resolve(true))),
      )
      .mockResolvedValue(true);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "a" },
    });
    view.rerender({ value: "b" });
    await settle();
    view.rerender({ value: "c" });
    let stored: boolean | undefined;
    const flushed = view.result.current.flush().then((done) => {
      stored = done;
    });
    await act(async () => finish());
    await act(() => flushed);
    expect(save).toHaveBeenLastCalledWith("c");
    expect(stored).toBe(true);
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("warns before the tab closes only while a change is not saved", async () => {
    const save = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(true);
    const view = renderQuillsHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: "a" },
    });
    const close = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(close()).toBe(false);
    view.rerender({ value: "b" });
    expect(close()).toBe(true);
    await settle();
    expect(view.result.current.state).toBe("failed");
    expect(close()).toBe(true);
    await act(() => view.result.current.retry());
    expect(close()).toBe(false);
  });
});
