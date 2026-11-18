import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { knowledgeFixture } from "../knowledge.fixture";
import { KnowledgeRow } from "./knowledge-row";

describe("KnowledgeRow", () => {
  it("shows the found title, the customer question, the gap, the step and the evidence", () => {
    const view = renderComponent(
      <KnowledgeRow
        suggestion={knowledgeFixture.suggestion()}
        href="/feedback/workspace_test_1/knowledge"
        onOpen={() => undefined}
      />,
    );
    const row = view.getByRole("link", { name: /Refunds/ });
    expect(row).toHaveTextContent("How do refunds work?");
    expect(row).toHaveTextContent("Gap");
    expect(row).toHaveTextContent("Questions to answer");
    expect(row).toHaveTextContent("2 conversations");
  });

  it("shows the draft title and leaves out the gap badge", () => {
    const view = renderComponent(
      <KnowledgeRow
        suggestion={knowledgeFixture.suggestion({
          gap: false,
          status: "draft_ready",
          title: "Refund policy",
          evidenceCount: 1,
        })}
        href="/feedback/workspace_test_1/knowledge"
        onOpen={() => undefined}
      />,
    );
    const row = view.getByRole("link", { name: /Refund policy/ });
    expect(row).not.toHaveTextContent("Gap");
    expect(row).toHaveTextContent("Draft ready");
    expect(row).toHaveTextContent("1 conversation");
  });
});
