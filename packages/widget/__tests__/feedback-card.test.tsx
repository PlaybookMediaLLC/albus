import { afterEach, expect, it, vi } from "vite-plus/test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toMessage } from "../src/adapter/map.js";
import { FeedbackCard } from "../src/ui/FeedbackCard.js";

afterEach(cleanup);

it("maps the assistant's message and its proposed request", () => {
  expect(
    toMessage({
      id: "m1",
      fromVisitor: false,
      author: null,
      content: "I can pass it on.",
      createdAt: "2026-11-01T10:00:00.000Z",
      fromAssistant: true,
      feedbackCard: { title: "PDF export", body: "As PDF", status: "proposed" },
    }),
  ).toMatchObject({
    fromAssistant: true,
    feedbackCard: { title: "PDF export", body: "As PDF", confirmed: false },
  });
});

it("submits a proposed request once and shows a submitted one as done", async () => {
  let finish = () => {};
  const onConfirm = vi.fn(
    () => new Promise<void>((resolve) => (finish = resolve)),
  );
  const card = { title: "PDF export", body: "As PDF", confirmed: false };
  const { rerender } = render(
    <FeedbackCard card={card} onConfirm={onConfirm} />,
  );
  expect(screen.getByRole("heading", { name: "PDF export" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
  fireEvent.click(screen.getByRole("button", { name: "Sending…" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Submit request" })).toBeTruthy(),
  );
  rerender(
    <FeedbackCard card={{ ...card, confirmed: true }} onConfirm={onConfirm} />,
  );
  expect(screen.getByRole("status").textContent).toBe("Request submitted");
  expect(screen.queryByRole("button")).toBeNull();
});
