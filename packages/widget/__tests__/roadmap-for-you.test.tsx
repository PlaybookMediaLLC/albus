import { afterEach, expect, it, vi } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WidgetView, type FeedbackPost } from "../src/ui/index.js";

afterEach(cleanup);
// `voted` is the caller's own vote; the API sends no other customer's votes (#109).
const posts: FeedbackPost[] = [
  {
    id: "a",
    title: "CSV export",
    body: "",
    author: "Ada",
    status: "shipped",
    voted: true,
  },
  {
    id: "b",
    title: "Dark mode",
    body: "",
    author: "Ben",
    status: "shipped",
    voted: false,
  },
  {
    id: "c",
    title: "SSO",
    body: "",
    author: "Cy",
    status: "planned",
    voted: true,
  },
  {
    id: "d",
    title: "Webhooks",
    body: "",
    author: "Di",
    status: "in_progress",
    voted: true,
  },
];
const roadmap = (identified: boolean, locale?: string) => {
  render(
    <WidgetView
      onClose={vi.fn()}
      initialTab="feedback"
      feedback={posts}
      identified={identified}
      locale={locale}
    />,
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Sort feedback" }), {
    target: { value: "roadmap" },
  });
};
const marked = () =>
  screen
    .queryAllByText("For you")
    .map(
      (mark) => mark.closest("button")?.querySelector("strong")?.textContent,
    );

it("marks each shipped request that the signed-in customer voted for, and no other", () => {
  roadmap(true);
  expect(marked()).toEqual(["CSV export"]);
  // In progress, planned, then shipped.
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
  ).toEqual(["In progress", "Planned", "Shipped"]);
});

it("shows no mark to a guest", () => {
  roadmap(false);
  expect(marked()).toEqual([]);
});

it("writes the mark in the visitor's language", () => {
  roadmap(true, "de-AT");
  expect(screen.getByText("Für Sie")).toBeTruthy();
  expect(screen.queryByText("For you")).toBeNull();
});
