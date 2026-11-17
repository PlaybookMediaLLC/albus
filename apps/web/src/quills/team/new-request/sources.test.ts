import { describe, expect, it } from "vite-plus/test";
import { sourceKeys, sources } from "./sources";

describe("sources", () => {
  it("labels every source a teammate picks and every source a route records", () => {
    for (const source of [...sources, "conversation", "ticket", "app"])
      expect(sourceKeys[source]).toMatch(/^team-posts\.source/);
    // Votes tracked from a conversation before #73 stored "live_chat".
    expect(sourceKeys.live_chat).toBe(sourceKeys.conversation);
  });
});
