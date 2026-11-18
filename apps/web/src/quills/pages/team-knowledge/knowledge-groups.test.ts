import { describe, expect, it } from "vite-plus/test";
import { knowledgeGroups } from "./knowledge-groups";
import { knowledgeFixture } from "./knowledge.fixture";

const labels = { gaps: "Gaps", others: "Others" };

describe("knowledgeGroups", () => {
  it("puts the gaps first and leaves out an empty group", () => {
    const gap = knowledgeFixture.suggestion();
    const other = knowledgeFixture.suggestion({
      id: "knowledge_test_2",
      gap: false,
    });
    expect(
      knowledgeGroups([other, gap], labels).map((group) => [
        group.label,
        group.items.map((item) => item.id),
      ]),
    ).toEqual([
      ["Gaps", [gap.id]],
      ["Others", [other.id]],
    ]);
    expect(knowledgeGroups([other], labels).map((group) => group.id)).toEqual([
      "others",
    ]);
  });
});
