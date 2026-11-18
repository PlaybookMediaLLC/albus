import { afterEach, expect, it, vi } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createApi } from "../src/adapter/api";
import { removeAvatar, uploadAvatar } from "../src/adapter/avatar";
import { WidgetView } from "../src/ui/index.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const json = (body: unknown) => new Response(JSON.stringify(body));

it("uploads a picture to the visitor's key and saves it", async () => {
  const calls: { method: string; path: string; body?: string }[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace("/base", "");
    calls.push({
      method: init?.method ?? "GET",
      path,
      body: init?.body as string,
    });
    if (path === "/widget/uploads")
      return json({
        key: "workspace/ws/quills/customer_avatar/c_1/a.webp",
        uploadUrl: "https://storage.example.test/put",
        headers: { "Content-Type": "image/webp" },
      });
    return json({ avatarUrl: "https://cdn.example.test/a.webp" });
  });
  const storage = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", storage);
  const api = createApi("/base", fetchImpl as unknown as typeof fetch);
  const file = new File(["webp"], "avatar.webp", { type: "image/webp" });
  await expect(uploadAvatar(api, file)).resolves.toBe(
    "https://cdn.example.test/a.webp",
  );
  expect(JSON.parse(calls[0]!.body!)).toMatchObject({
    purpose: "customer_avatar",
    contentType: "image/webp",
    size: 4,
  });
  expect(storage.mock.calls[0]![1]).toMatchObject({
    method: "PUT",
    credentials: "omit",
  });
  expect(calls[1]).toMatchObject({ method: "PUT", path: "/widget/avatar" });
  expect(JSON.parse(calls[1]!.body!)).toEqual({
    key: "workspace/ws/quills/customer_avatar/c_1/a.webp",
    contentType: "image/webp",
    size: 4,
  });
  await removeAvatar(api);
  expect(calls[2]).toMatchObject({ method: "DELETE", path: "/widget/avatar" });
});

it("shows Home's picture row only with a handler and reports a failure", async () => {
  const change = vi.fn(async () => {
    throw new Error("nope");
  });
  const { rerender } = render(<WidgetView onClose={vi.fn()} />);
  expect(screen.queryByText("Your picture")).toBeNull();
  rerender(<WidgetView onClose={vi.fn()} onChangeAvatar={change} />);
  const input = document.querySelector<HTMLInputElement>(
    ".qb-avatar-setting input[type=file]",
  )!;
  fireEvent.change(input, {
    target: { files: [new File(["x"], "me.png", { type: "image/png" })] },
  });
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not save the picture.",
  );
  expect(change).toHaveBeenCalledOnce();
});
