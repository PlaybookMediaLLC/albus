import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { CommandPalette, type CommandPaletteProps } from "./command-palette";

const posts = [
  { id: "post_1", title: "Dark mode" },
  { id: "post_2", title: "Dark theme" },
];

function renderPalette(
  items = posts,
  query = "dark",
  extra: Partial<CommandPaletteProps<(typeof posts)[number]>> = {},
) {
  const onSelect = vi.fn();
  const onQueryChange = vi.fn();
  const onOpenChange = vi.fn();
  const view = renderComponent(
    <CommandPalette
      open
      onOpenChange={onOpenChange}
      label="Merge into"
      chip="Merge into"
      placeholder="Find the request to merge this into…"
      query={query}
      onQueryChange={onQueryChange}
      items={items}
      getKey={(post) => post.id}
      renderItem={(post) => post.title}
      onSelect={onSelect}
      {...extra}
    />,
  );
  return { view, onSelect, onQueryChange, onOpenChange };
}

describe("CommandPalette", () => {
  it("shows the chip, the field and the results in a named dialog", async () => {
    const { view, onQueryChange } = renderPalette();
    const dialog = await view.findByRole("dialog", { name: "Merge into" });
    expect(dialog).toHaveTextContent("Merge into");
    const field = view.getByRole("combobox", {
      name: "Find the request to merge this into…",
    });
    fireEvent.change(field, { target: { value: "dark m" } });
    expect(onQueryChange).toHaveBeenCalledWith("dark m");
    expect(view.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Dark mode",
      "Dark theme",
    ]);
  });

  it("moves with the arrow keys and selects with Enter or a click", async () => {
    const { view, onSelect, onQueryChange } = renderPalette();
    const field = await view.findByRole("combobox");
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(view.getByRole("option", { name: "Dark theme" })).toHaveAttribute(
      "data-highlighted",
    );
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.click(view.getByRole("option", { name: "Dark mode" }));
    expect(onSelect.mock.calls).toEqual([[posts[1]], [posts[0]]]);
    // A selection does not replace the query with the text of the item.
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it("closes with Escape", async () => {
    const { view, onOpenChange } = renderPalette();
    fireEvent.keyDown(await view.findByRole("combobox"), { key: "Escape" });
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });

  it("says when the search has no results", async () => {
    const { view } = renderPalette([], "zzz");
    expect(await view.findByRole("status")).toHaveTextContent("No results");
  });

  it("shows a failed search with a retry instead of No results", async () => {
    const onRetry = vi.fn();
    const { view } = renderPalette([], "zzz", {
      problem: { kind: "failed" },
      onRetry,
    });
    const alert = await view.findByRole("alert");
    expect(alert).toHaveTextContent(/went wrong/i);
    // The empty slot is a polite live region; the alert must not sit inside it.
    expect(alert.closest('[role="status"]')).toBeNull();
    expect(view.queryByText("No results")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("says nothing while the search waits or runs", async () => {
    const { view } = renderPalette([], "zzz", { loading: true });
    await view.findByRole("dialog", { name: "Merge into" });
    expect(view.queryByText("No results")).toBeNull();
  });
});
