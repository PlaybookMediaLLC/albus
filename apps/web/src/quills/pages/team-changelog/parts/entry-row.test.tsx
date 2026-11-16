import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { entryDate, EntryRow } from "./entry-row";

const entry = {
  title: "November release",
  status: "scheduled" as const,
  displayDate: null,
  publishedAt: "2030-11-05T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("EntryRow", () => {
  it("shows the status, the title and the publish date, and opens the editor", () => {
    const onOpen = vi.fn();
    const view = renderComponent(
      <EntryRow entry={entry} href="/changelog/1" onOpen={onOpen} />,
    );
    const row = view.getByRole("link", { name: /November release/ });
    expect(view.getByRole("img", { name: "Scheduled" })).toBeInTheDocument();
    expect(row.querySelector("time")).toHaveAttribute(
      "datetime",
      "2030-11-05T12:00:00.000Z",
    );
    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("names the author beside the date", () => {
    const view = renderComponent(
      <EntryRow
        entry={{ ...entry, author: { name: "Grace Hopper", avatarUrl: null } }}
        href="/changelog/1"
        onOpen={vi.fn()}
      />,
    );
    expect(view.getByRole("link")).toHaveTextContent("Grace Hopper");
  });

  it("prefers the display date and names an untitled draft", () => {
    const view = renderComponent(
      <EntryRow
        entry={{
          ...entry,
          title: "",
          status: "draft",
          displayDate: "2026-02-02T00:00:00.000Z",
        }}
        href="/changelog/1"
        onOpen={() => undefined}
      />,
    );
    expect(view.getByRole("link")).toHaveTextContent("Untitled");
    expect(view.getByRole("img", { name: "Draft" })).toBeInTheDocument();
    expect(view.getByRole("link").querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-02-02T00:00:00.000Z",
    );
  });

  it("adds the year only for another year", () => {
    const now = Date.parse("2026-06-01T00:00:00.000Z");
    expect(entryDate("2026-11-05T12:00:00.000Z", "en-US", now)).toBe("Nov 5");
    expect(entryDate("2025-11-05T12:00:00.000Z", "en-US", now)).toBe(
      "Nov 5, 2025",
    );
  });
});
