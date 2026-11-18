import { describe, expect, it } from "vite-plus/test";
import { repairJson } from "./repair";

describe("repairJson", () => {
  it("removes a fence, text around the object and trailing commas", () => {
    expect(repairJson('```json\n{"a": 1, "b": [1, 2,],}\n```')).toBe(
      '{"a": 1, "b": [1, 2]}',
    );
    expect(repairJson('Sure! Here it is: {"same": true} Hope it helps.')).toBe(
      '{"same": true}',
    );
  });

  it("gives up instead of inventing a value", () => {
    expect(repairJson("no json here")).toBeNull();
    expect(repairJson('{"a": }')).toBeNull();
  });
});
