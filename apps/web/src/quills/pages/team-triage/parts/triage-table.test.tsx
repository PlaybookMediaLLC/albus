import { describe, expect, it, vi } from "vite-plus/test";
import { setPostScoreFixture } from "../../../api/team/set-post-score.fixture";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { TriageTable, type TriageTableProps } from "./triage-table";

const post = {
  ...setPostScoreFixture.ok({
    id: "post_test_1",
    title: "Export history",
    voteCount: 3,
    score: { reach: 10, impact: 2, confidence: 50, effort: 2, rice: 5 },
  }),
  demand: {
    voters: 3,
    companies: 1,
    mrrCents: 25000,
    importance: { nice: 0, important: 1, critical: 2 },
  },
  teamScore: 7,
};
const factors = [{ id: "impact", name: "Impact", weight: 3 }];
const props = (over: Partial<TriageTableProps> = {}): TriageTableProps => ({
  posts: [post],
  money: (cents) => `$${cents / 100}`,
  canScore: true,
  revenue: true,
  factors,
  editing: null,
  onEdit: vi.fn(),
  onScore: vi.fn(async () => undefined),
  onScoreFactors: vi.fn(async () => undefined),
  ...over,
});

describe("TriageTable", () => {
  it("shows a request's votes, importance, companies, revenue, RICE and team score", () => {
    const view = renderComponent(<TriageTable {...props()} />);
    const row = view.getByRole("row", { name: /export history/i });
    expect(row).toHaveTextContent("Export history30121$25057");
  });

  it("opens the factor editor and sends the post's factor values", () => {
    const onEdit = vi.fn();
    const view = renderComponent(<TriageTable {...props({ onEdit })} />);
    press(/edit the factor values of .export history/i);
    expect(onEdit).toHaveBeenCalledWith({
      postId: "post_test_1",
      mode: "factors",
    });
    view.rerender(
      <TriageTable
        {...props({
          onEdit,
          editing: { postId: "post_test_1", mode: "factors" },
        })}
      />,
    );
    expect(view.getByLabelText("Impact (weight 3)")).toBeVisible();
  });

  it("leaves out the revenue column without view_revenue", () => {
    const view = renderComponent(
      <TriageTable
        {...props({
          revenue: false,
          posts: [{ ...post, demand: { ...post.demand, mrrCents: null } }],
        })}
      />,
    );
    expect(view.queryByRole("columnheader", { name: "MRR" })).toBeNull();
    expect(
      view.getByRole("row", { name: /export history/i }),
    ).toHaveTextContent("Export history3012157");
  });

  it("does not offer a factor editor before the team has factors", () => {
    const view = renderComponent(<TriageTable {...props({ factors: [] })} />);
    expect(
      view.queryByRole("button", { name: /edit the factor values/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the inline score editor with the current inputs", () => {
    const onEdit = vi.fn();
    const view = renderComponent(<TriageTable {...props({ onEdit })} />);
    press(/edit the score of .export history/i);
    expect(onEdit).toHaveBeenCalledWith({
      postId: "post_test_1",
      mode: "rice",
    });
    view.rerender(
      <TriageTable
        {...props({ onEdit, editing: { postId: "post_test_1", mode: "rice" } })}
      />,
    );
    expect(view.getByLabelText("Reach")).toHaveValue("10");
    expect(
      view.getByRole("button", { name: /edit the score of .export history/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the score without an editor when the teammate cannot update", () => {
    const view = renderComponent(
      <TriageTable {...props({ canScore: false, posts: [] })} />,
    );
    expect(view.getByText("No requests to rank")).toBeVisible();
    expect(view.queryByRole("button")).not.toBeInTheDocument();
  });
});
