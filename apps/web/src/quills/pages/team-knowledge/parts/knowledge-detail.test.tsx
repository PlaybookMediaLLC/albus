import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { knowledgeFixture } from "../knowledge.fixture";
import { KnowledgeDetail } from "./knowledge-detail";

const steps = {
  audience: "team" as const,
  busy: false,
  onAudienceChange: () => undefined,
  onAnswer: () => Promise.resolve(),
  onSkip: () => undefined,
  onSave: () => Promise.resolve(),
  onDraftChange: () => undefined,
};
const detail = knowledgeFixture.detail();
const [first, second] = detail.questions;

describe("KnowledgeDetail", () => {
  it("shows the customer question, what the AI found and the first question", () => {
    const view = renderComponent(
      <KnowledgeDetail suggestion={detail} {...steps} />,
    );
    expect(
      view.getByRole("region", { name: "Customer question" }),
    ).toHaveTextContent("How do refunds work?");
    expect(
      view.getByRole("region", { name: "What the AI found" }),
    ).toHaveTextContent("RefundsRefunds take five days.");
    expect(
      view.getByRole("region", { name: "Question 1 of 2" }),
    ).toHaveTextContent("Do refunds include shipping?");
    expect(view.queryByRole("region", { name: "Your answers" })).toBeNull();
  });

  it("lists the answers and the skipped questions, then waits for the draft", () => {
    const view = renderComponent(
      <KnowledgeDetail
        suggestion={knowledgeFixture.detail({
          status: "drafting",
          stepIndex: 2,
          questions: [
            { ...first!, answer: "Yes" },
            { ...second!, skipped: true },
          ],
        })}
        {...steps}
      />,
    );
    expect(
      view.getByRole("region", { name: "Your answers" }),
    ).toHaveTextContent(
      "Do refunds include shipping?YesWho approves a refund?Skipped",
    );
    expect(view.getByRole("status")).toHaveTextContent(
      "The AI is writing the draft from your answers.",
    );
    expect(view.queryByRole("textbox")).toBeNull();
  });

  it("shows the draft to edit when it is ready, and the final text after a decision", () => {
    const view = renderComponent(
      <KnowledgeDetail
        suggestion={knowledgeFixture.detail({
          status: "draft_ready",
          stepIndex: 2,
          title: "Refund policy",
          content: "Refunds take five days and include shipping.",
        })}
        {...steps}
      />,
    );
    expect(view.getByLabelText("Title")).toHaveValue("Refund policy");
    view.rerender(
      <KnowledgeDetail
        suggestion={knowledgeFixture.detail({
          status: "approved",
          title: "Refund policy",
          content: "Refunds take five days and include shipping.",
        })}
        {...steps}
      />,
    );
    expect(view.queryByLabelText("Title")).toBeNull();
    expect(
      view.getByText("Refunds take five days and include shipping."),
    ).toBeInTheDocument();
  });
});
