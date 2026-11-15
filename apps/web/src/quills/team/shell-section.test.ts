import { describe, expect, it } from "vite-plus/test";
import { shellSection } from "./shell-section";

describe("shellSection", () => {
  it("maps each teammate address to its rail section", () => {
    const cases: [string, string][] = [
      ["/feedback/ws_1/conversations/queue", "conversations"],
      ["/feedback/ws_1/Tickets/t_1", "conversations"],
      ["/feedback/ws_1/my-tickets", "conversations"],
      ["/feedback/ws_1/posts", "requests"],
      ["/feedback/ws_1/posts/post_1", "requests"],
      ["/feedback/ws_1/boards", "requests"],
      ["/feedback/ws_1", "workspace"],
      ["/feedback/ws_1/members/m_1", "workspace"],
      ["/feedback/ws_1/postscript", "workspace"],
    ];
    for (const [path, section] of cases)
      expect(shellSection(path), path).toBe(section);
  });
});
