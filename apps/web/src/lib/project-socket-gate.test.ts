import { afterEach, expect, it, vi } from "vite-plus/test";
import {
  projectSocketConnecting,
  projectSocketOpened,
  projectSocketStopped,
  waitForProjectSocket,
} from "./project-socket-gate";

afterEach(() => {
  projectSocketStopped("p");
  vi.useRealTimers();
});

it("does not wait when no socket is connecting", async () => {
  await waitForProjectSocket("p");
  expect(projectSocketOpened("p")).toBe(false);
});

it("releases a waiting load when the socket opens and reports it", async () => {
  projectSocketConnecting("p");
  let released = false;
  const waiting = waitForProjectSocket("p").then(() => (released = true));
  await Promise.resolve();
  expect(released).toBe(false);
  expect(projectSocketOpened("p")).toBe(true);
  await waiting;
  expect(released).toBe(true);
});

it("lets a load proceed after the timeout, and then reports no waiter", async () => {
  vi.useFakeTimers();
  projectSocketConnecting("p");
  const waiting = waitForProjectSocket("p", undefined, 1000);
  await Promise.resolve();
  vi.advanceTimersByTime(1000);
  await waiting;
  expect(projectSocketOpened("p")).toBe(false);
});

it("releases waiting loads when the socket stops", async () => {
  projectSocketConnecting("p");
  const waiting = waitForProjectSocket("p");
  await Promise.resolve();
  projectSocketStopped("p");
  await waiting;
  expect(projectSocketOpened("p")).toBe(false);
});
