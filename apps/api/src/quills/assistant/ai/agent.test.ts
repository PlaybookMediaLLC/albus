import { beforeEach, describe, expect, it } from "vite-plus/test";
import { chatReply, provider } from "../provider-edge.fixture";
import { runToolLoop, type LoopTool } from "./agent";

// The tool loop's rules against the local OpenAI-compatible server (no database).

const chats = () =>
  provider.requests.filter((request) =>
    request.path.endsWith("/chat/completions"),
  );
const call = (id: string, name = "lookup", args = '{"q":"x"}') => ({
  id,
  type: "function",
  function: { name, arguments: args },
});
const lookup = (run: LoopTool["run"]): LoopTool => ({
  name: "lookup",
  description: "Look something up.",
  parameters: { type: "object", properties: { q: { type: "string" } } },
  run,
});
const loop = (tools: LoopTool[]) =>
  runToolLoop({
    messages: [{ role: "user", content: "go" }],
    tools,
    maxSteps: 4,
    maxCallsPerStep: 5,
    maxOutputTokens: 300,
    timeoutMs: 30_000,
    stepTimeoutMs: 10_000,
    onStep: () => undefined,
    onDenied: () => undefined,
  });

describe("runToolLoop", () => {
  beforeEach(() => {
    provider.requests.length = 0;
    provider.reply();
  });

  it("stops at a handler's own error: no further model call, and its text never reaches the provider", async () => {
    provider.reply(() => chatReply(null, [call("c1")]));
    const bug = new Error(
      "Failed query: select secret from quills.private where id = $1",
    );
    await expect(
      loop([
        lookup(async () => {
          throw bug;
        }),
      ]),
    ).rejects.toBe(bug);
    expect(chats()).toHaveLength(1);
    expect(JSON.stringify(provider.requests)).not.toContain("secret");
  });

  it("runs at most 5 calls in a step and skips the rest", async () => {
    let step = 0;
    provider.reply(() =>
      step++ === 0
        ? chatReply(
            null,
            Array.from({ length: 6 }, (_, i) => call(`c${i}`)),
          )
        : chatReply("done"),
    );
    let ran = 0;
    expect(await loop([lookup(async () => `result ${++ran}`)])).toBe("done");
    expect(ran).toBe(5);
    const results = chats()[1]!.body.messages.filter(
      (message: { role: string }) => message.role === "tool",
    );
    expect(results).toHaveLength(6);
    expect(results[5].content).toContain("Skipped: at most 5 tool calls");
  });

  it("makes at most 4 model calls, and the last one offers no tool, so the model must answer", async () => {
    provider.reply(({ body }) =>
      body.tools
        ? chatReply(null, [call(`c${chats().length}`)])
        : chatReply("final"),
    );
    expect(await loop([lookup(async () => "result")])).toBe("final");
    expect(chats()).toHaveLength(4);
    expect(
      chats()
        .slice(0, 3)
        .every((request) => request.body.tools?.length === 1),
    ).toBe(true);
    expect(chats()[3]!.body.tools).toBeUndefined();
  });
});
