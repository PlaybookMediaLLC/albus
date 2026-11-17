import { afterEach, expect, it, vi } from "vite-plus/test";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createApi } from "../src/adapter/api";
import { useWidgetData } from "../src/adapter/useWidgetData";

afterEach(cleanup);

it("maps a reply's files and opens one through the conversation file route", async () => {
  const reply = {
    id: "r1",
    fromVisitor: false,
    author: { name: "Ana", avatarUrl: null },
    content: "Here it is",
    createdAt: "2026-11-01T00:01:00.000Z",
    attachments: [{ fileId: "file_1", name: "invoice.pdf" }],
  };
  const summary = {
    id: "c1",
    subject: "Billing",
    preview: null,
    unreadCount: 0,
    lastMessageAt: reply.createdAt,
  };
  const fetchImpl = vi.fn(async (url: string) => {
    const path = url.replace("/base", "");
    const json = (body: unknown) => new Response(JSON.stringify(body));
    if (path === "/widget/unread") return json({ unreadCount: 0 });
    if (path === "/widget/conversations?limit=20")
      return json({ items: [summary] });
    if (path === "/widget/conversations/c1")
      return json({ conversation: summary, messages: [reply] });
    if (path === "/widget/conversations/c1/files/file_1")
      return json({ downloadUrl: "https://storage.example.test/a.pdf" });
    return new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
    });
  });
  const api = createApi("/base", fetchImpl as unknown as typeof fetch);
  api.setToken("tok");
  const { result } = renderHook(() =>
    useWidgetData({
      api,
      session: 1,
      active: true,
      surfaces: {
        feedback: false,
        changelog: false,
        help: false,
        messenger: true,
      },
      host: { event: vi.fn(), unread: vi.fn(), expired: vi.fn() },
    }),
  );
  await waitFor(() =>
    expect(result.current.conversations?.[0]?.messages[0]?.files).toEqual([
      { id: "file_1", name: "invoice.pdf" },
    ]),
  );
  let url = "";
  await act(async () => {
    url = await result.current.onOpenFile!("c1", "file_1");
  });
  expect(url).toBe("https://storage.example.test/a.pdf");
});
