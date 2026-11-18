import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { KnowledgeActions } from "./knowledge-actions";

describe("KnowledgeActions", () => {
  it("approves or dismisses a ready draft", () => {
    const onApprove = vi.fn();
    const onDismiss = vi.fn();
    const view = renderComponent(
      <KnowledgeActions
        suggestion={{ status: "draft_ready" }}
        busy={false}
        onApprove={onApprove}
        onDismiss={onDismiss}
      />,
    );
    expect(
      view.getByRole("group", { name: "Suggestion actions" }),
    ).toHaveTextContent("Draft ready");
    press("Approve");
    expect(onApprove).toHaveBeenCalledOnce();
    press("Dismiss");
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("only dismisses while questions are open, and shows nothing after a decision", () => {
    const view = renderComponent(
      <KnowledgeActions
        suggestion={{ status: "awaiting_answer" }}
        busy={false}
        onApprove={() => undefined}
        onDismiss={() => undefined}
      />,
    );
    expect(view.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(view.getByRole("button", { name: "Dismiss" })).toBeEnabled();
    view.rerender(
      <KnowledgeActions
        suggestion={{ status: "approved" }}
        busy={false}
        onApprove={() => undefined}
        onDismiss={() => undefined}
      />,
    );
    expect(
      view.queryByRole("group", { name: "Suggestion actions" }),
    ).toBeNull();
  });
});
