import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { knowledgeFixture } from "../knowledge.fixture";
import { KnowledgeView } from "./knowledge-view";

const first = knowledgeFixture.suggestion({ status: "draft_ready" });
const second = knowledgeFixture.suggestion({
  id: "knowledge_test_2",
  candidateTitle: "Shipping times",
});

describe("KnowledgeView", () => {
  it("shows the compact list, the open suggestion, the result and the decisions", () => {
    const onMove = vi.fn();
    const onApprove = vi.fn();
    const view = renderComponent(
      <KnowledgeView
        workspaceId="workspace_test_1"
        suggestion={first}
        detail={knowledgeFixture.detail({
          status: "draft_ready",
          title: "Refunds",
          content: "Refunds take five days.",
        })}
        suggestions={[first, second]}
        message="The draft is saved."
        problem={{ kind: "failed" }}
        onMove={onMove}
        onBack={() => undefined}
        steps={{
          audience: "team",
          busy: false,
          onAudienceChange: () => undefined,
          onAnswer: () => Promise.resolve(),
          onSkip: () => undefined,
          onSave: () => Promise.resolve(),
          onDraftChange: () => undefined,
        }}
        actions={{ busy: false, onApprove, onDismiss: () => undefined }}
      />,
    );
    expect(view.getByRole("region", { name: "Knowledge" })).toHaveTextContent(
      "Shipping times",
    );
    expect(
      view.getByRole("heading", { level: 1, name: "Refunds" }),
    ).toBeInTheDocument();
    expect(view.getByText("The draft is saved.")).toBeInTheDocument();
    expect(view.getByRole("alert")).toBeInTheDocument();
    press("Next");
    expect(onMove).toHaveBeenCalledWith(second.id);
    press("Approve");
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("shows the loading state until the detail answers", () => {
    const view = renderComponent(
      <KnowledgeView
        workspaceId="workspace_test_1"
        suggestion={first}
        detail={undefined}
        suggestions={[first]}
        message=""
        problem={null}
        onMove={() => undefined}
        onBack={() => undefined}
        steps={{
          audience: "team",
          busy: false,
          onAudienceChange: () => undefined,
          onAnswer: () => Promise.resolve(),
          onSkip: () => undefined,
          onSave: () => Promise.resolve(),
          onDraftChange: () => undefined,
        }}
        actions={{
          busy: false,
          onApprove: () => undefined,
          onDismiss: () => undefined,
        }}
      />,
    );
    expect(
      view.queryByRole("region", { name: "Customer question" }),
    ).toBeNull();
    expect(view.getByText(/loading/i)).toBeInTheDocument();
  });
});
