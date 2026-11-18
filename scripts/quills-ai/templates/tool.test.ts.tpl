import { describe, expect, it } from "vite-plus/test";
import { {{camel}} } from "./{{name}}";

describe("{{camel}}", () => {
  it("validates its arguments before it runs", () => {
    // TODO(quills-ai): valid and invalid arguments for the real schema.
    expect({{camel}}.args.safeParse({}).success).toBe(false);
  });

});
