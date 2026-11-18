import { describe, expect, it } from "vite-plus/test";
import { normalizeResponse } from "./compat";

const CHAT = "https://ai.example/v1/chat/completions";
const run = async (url: string, body: unknown) =>
  (await normalizeResponse(url, new Response(JSON.stringify(body)))).json();
const reason = async (body: unknown) =>
  (await run(CHAT, body)).choices[0].finish_reason;

describe("normalizeResponse", () => {
  it("fills in a missing finish reason from the message", async () => {
    expect(
      await reason({
        choices: [{ message: { content: null, tool_calls: [{ id: "c" }] } }],
      }),
    ).toBe("tool_calls");
    expect(await reason({ choices: [{ message: { content: "hi" } }] })).toBe(
      "stop",
    );
    expect(
      await reason({
        choices: [{ finish_reason: "length", message: { content: "x" } }],
      }),
    ).toBe("length");
  });

  it("puts embeddings in index order", async () => {
    const body = await run("https://ai.example/v1/embeddings", {
      data: [
        { index: 1, embedding: [2] },
        { index: 0, embedding: [1] },
      ],
    });
    expect(
      body.data.map((row: { embedding: number[] }) => row.embedding),
    ).toEqual([[1], [2]]);
  });

  it("passes other answers through", async () => {
    expect(
      await (await normalizeResponse(CHAT, new Response("not json"))).text(),
    ).toBe("not json");
    const other = new Response("{}", { status: 500 });
    expect(await normalizeResponse(CHAT, other)).toBe(other);
  });
});
