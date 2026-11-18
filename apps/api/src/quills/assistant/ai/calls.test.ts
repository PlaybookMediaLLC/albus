import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { z } from "zod";
import { chatReply, provider } from "../provider-edge.fixture";
import { chatJson, embed } from "./calls";

// What goes on the wire (no database): the model of each role, JSON mode, the output-token
// backstop, and embeddings in input order.

const lastChat = () =>
  provider.requests
    .filter((request) => request.path.endsWith("/chat/completions"))
    .at(-1)!.body;
const same = z.object({ same: z.boolean() });

describe("AI calls on the wire", () => {
  beforeEach(() => {
    provider.requests.length = 0;
    provider.reply(() => chatReply({ same: true }));
  });
  // An empty role model falls back to QUILLS_AI_MODEL; the fixture keeps its own settings.
  afterEach(() => vi.stubEnv("QUILLS_AI_MODEL_FAST", ""));

  it("sends JSON mode, the role's model and the default output limit", async () => {
    vi.stubEnv("QUILLS_AI_MODEL_FAST", "cheap-fast-model");
    const result = await chatJson(
      same,
      [{ role: "user", content: "x" }],
      undefined,
      "fast",
    );
    expect(result.value).toEqual({ same: true });
    expect(result.usage.model).toBe("cheap-fast-model");
    expect(lastChat()).toMatchObject({
      model: "cheap-fast-model",
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });
  });

  it("keeps a large limit for long translations and caps a larger one", async () => {
    await chatJson(same, [{ role: "user", content: "x" }], 8000);
    expect(lastChat().max_tokens).toBe(8000);
    await chatJson(same, [{ role: "user", content: "x" }], 100_000);
    expect(lastChat().max_tokens).toBe(8192);
  });

  it("repairs a fenced answer once, and calls an answer that fits no schema a bad response", async () => {
    provider.reply(() => chatReply('```json\n{"same": false,}\n```'));
    expect(
      (await chatJson(same, [{ role: "user", content: "x" }])).value,
    ).toEqual({ same: false });
    provider.reply(() => chatReply({ other: 1 }));
    await expect(
      chatJson(same, [{ role: "user", content: "x" }]),
    ).rejects.toMatchObject({
      code: "bad_response",
    });
  });

  it("returns embeddings in input order, whatever order the server uses", async () => {
    const vector = (value: number) => Array.from({ length: 1536 }, () => value);
    provider.reply(() => ({
      json: {
        data: [
          { index: 1, embedding: vector(0.2) },
          { index: 0, embedding: vector(0.1) },
        ],
        usage: { prompt_tokens: 4, total_tokens: 4 },
      },
    }));
    const { vectors } = await embed(["first", "second"]);
    expect(vectors.map((row) => row[0])).toEqual([0.1, 0.2]);
  });
});
