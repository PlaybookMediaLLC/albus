import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { KnowledgeQuestion } from "./knowledge-question";

const props = {
  question: "Do refunds include shipping?",
  suggestedAnswers: ["Yes, always", "No"],
  number: 1,
  total: 2,
  busy: false,
};

describe("KnowledgeQuestion", () => {
  it("fills the answer from a suggested answer and sends it", async () => {
    const onAnswer = vi.fn(() => Promise.resolve());
    const view = renderComponent(
      <KnowledgeQuestion
        {...props}
        onAnswer={onAnswer}
        onSkip={() => undefined}
      />,
    );
    expect(
      view.getByRole("region", { name: "Question 1 of 2" }),
    ).toHaveTextContent("Do refunds include shipping?");
    fireEvent.click(view.getByRole("button", { name: "Yes, always" }));
    expect(view.getByLabelText("Your answer")).toHaveValue("Yes, always");
    press("Send answer");
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith("Yes, always"));
  });

  it("sends nothing for an empty answer, and skips", async () => {
    const onAnswer = vi.fn(() => Promise.resolve());
    const onSkip = vi.fn();
    const view = renderComponent(
      <KnowledgeQuestion
        {...props}
        suggestedAnswers={[]}
        onAnswer={onAnswer}
        onSkip={onSkip}
      />,
    );
    expect(view.queryByRole("group", { name: "Suggested answers" })).toBeNull();
    press("Send answer");
    expect(await view.findByRole("alert")).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
    press("Skip question");
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
