import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getRevenueAtRiskFixture } from "../../api/team/get-revenue-at-risk.fixture";
import { getScoringFactorsFixture } from "../../api/team/get-scoring-factors.fixture";
import { listSegmentsFixture } from "../../api/team/list-segments.fixture";
import { setPostFactorScoresFixture } from "../../api/team/set-post-factor-scores.fixture";
import { listPostsFixture } from "../../api/team/list-posts.fixture";
import { setPostScoreFixture } from "../../api/team/set-post-score.fixture";
import { choose, fill, press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { TeamTriagePage } from "./team-triage-page";

const post = {
  ...setPostScoreFixture.ok({
    id: "post_test_1",
    title: "Export history",
    voteCount: 4,
  }),
  demand: {
    voters: 4,
    companies: 2,
    mrrCents: 150000,
    importance: { nice: 1, important: 1, critical: 2 },
  },
  teamScore: null,
};
const prepare = (
  factors: { id: string; name: string; weight: number }[] = [],
) => {
  const api = mockApi();
  api.reply(listPostsFixture.ok({ items: [post] }));
  api.reply(getRevenueAtRiskFixture.ok({ companies: 2, mrrCents: 150000 }));
  api.reply(getScoringFactorsFixture.ok({ factors }));
  api.reply(listSegmentsFixture.ok());
  return api;
};

let api: ReturnType<typeof mockApi>;

describe("TeamTriagePage", () => {
  describePageContract(meta, TeamTriagePage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let i = 0; i < 4; i++) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let i = 0; i < 4; i++) api.fail();
      },
    },
    ready: {
      prepare: () => {
        prepare();
      },
      assert: async (view) => {
        await view.findByText("Export history");
      },
    },
    done: {
      prepare: () => {
        api = prepare();
        api.reply(setPostScoreFixture.ok({ id: post.id }));
        api.reply(listPostsFixture.ok({ items: [post] }));
      },
      act: async (view) => {
        await view.findByRole("button", { name: /edit the score of/i });
        press(/edit the score of .export history/i);
        fill("Reach", "10");
        press("Save score");
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("setQuillsPostScore")).toHaveLength(1),
        );
      },
    },
  });

  describe("behavior", () => {
    it("shows demand, revenue at risk and sorts by revenue", async () => {
      api = prepare();
      api.reply(listPostsFixture.ok({ items: [post] }));
      const view = renderPage(TeamTriagePage, meta);
      expect(
        await view.findByRole("rowheader", { name: "Export history" }),
      ).toBeVisible();
      expect(view.getByText(/1,500 MRR from 2 companies/)).toBeVisible();
      press("Filters");
      expect(
        await view.findByRole("menuitemradio", { name: "Votes" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        view.getByRole("group", { name: "Sort requests" }),
      ).toBeInTheDocument();
      fireEvent.click(view.getByRole("menuitemradio", { name: "MRR" }));
      await waitFor(() => expect(api.calls("listQuillsPosts")).toHaveLength(2));
      expect(
        new URL(api.calls("listQuillsPosts")[1]!.url).searchParams.get("sort"),
      ).toBe("mrr");
    });

    it("saves a score from the inline editor", async () => {
      api = prepare();
      api.reply(
        setPostScoreFixture.ok({
          id: post.id,
          score: { reach: 100, impact: 2, confidence: 80, effort: 4, rice: 40 },
        }),
      );
      api.reply(listPostsFixture.ok({ items: [post] }));
      const view = renderPage(TeamTriagePage, meta);
      await view.findByRole("button", {
        name: /edit the score of .export history/i,
      });
      press(/edit the score of .export history/i);
      fill("Reach", "100");
      fill("Confidence (%)", "80");
      fill("Effort (person-weeks)", "4");
      await choose("Impact", "2 · High");
      press("Save score");
      await waitFor(() =>
        expect(api.calls("setQuillsPostScore")).toHaveLength(1),
      );
      expect(await api.calls("setQuillsPostScore")[0]!.json()).toEqual({
        reach: 100,
        impact: 2,
        confidence: 80,
        effort: 4,
      });
    });

    it("filters by revenue and votes, and sorts by the team score", async () => {
      api = prepare();
      api.reply(listPostsFixture.ok({ items: [post] }));
      api.reply(listPostsFixture.ok({ items: [post] }));
      const view = renderPage(TeamTriagePage, meta);
      await view.findByRole("rowheader", { name: "Export history" });
      expect(view.getByText(/Add scoring factors/)).toBeVisible();
      fill("Minimum MRR", "100");
      fill("Minimum votes", "3");
      press("Apply filters");
      await waitFor(() => expect(api.calls("listQuillsPosts")).toHaveLength(2));
      const filtered = new URL(api.calls("listQuillsPosts")[1]!.url)
        .searchParams;
      expect(filtered.get("minMrrCents")).toBe("10000");
      expect(filtered.get("minVotes")).toBe("3");
      // The fields keep the applied filters after the list reloads.
      expect(await view.findByLabelText("Minimum MRR")).toHaveValue("100");
      press("Filters");
      fireEvent.click(
        await view.findByRole("menuitemradio", { name: "Score" }),
      );
      await waitFor(() => expect(api.calls("listQuillsPosts")).toHaveLength(3));
      expect(
        new URL(api.calls("listQuillsPosts")[2]!.url).searchParams.get("sort"),
      ).toBe("score");
    });

    it("saves a request's factor values", async () => {
      api = prepare([{ id: "impact", name: "Impact", weight: 3 }]);
      api.reply(setPostFactorScoresFixture.ok({ score: 24 }));
      api.reply(listPostsFixture.ok({ items: [post] }));
      const view = renderPage(TeamTriagePage, meta);
      press(
        (
          await view.findByRole("button", {
            name: /edit the factor values of .export history/i,
          })
        ).getAttribute("aria-label")!,
      );
      fill("Impact (weight 3)", "8");
      press("Save factors");
      await waitFor(() =>
        expect(api.calls("setQuillsPostFactorScores")).toHaveLength(1),
      );
      expect(await api.calls("setQuillsPostFactorScores")[0]!.json()).toEqual({
        values: [{ factorId: "impact", value: 8 }],
      });
    });

    it("asks for no revenue and offers no revenue order without view_revenue", async () => {
      const api = mockApi();
      api.reply(
        listPostsFixture.ok({
          items: [{ ...post, demand: { ...post.demand, mrrCents: null } }],
        }),
      );
      api.reply(getScoringFactorsFixture.ok({ factors: [] }));
      api.reply(listSegmentsFixture.ok());
      const view = renderPage(TeamTriagePage, meta, {
        permissions: { viewRevenue: false },
      });
      await view.findByRole("rowheader", { name: "Export history" });
      expect(api.calls("getQuillsRevenueAtRisk")).toHaveLength(0);
      expect(view.queryByText("Revenue at risk")).toBeNull();
      expect(view.queryByLabelText("Minimum MRR")).toBeNull();
      press("Filters");
      await view.findByRole("menuitemradio", { name: "Votes" });
      expect(view.queryByRole("menuitemradio", { name: "MRR" })).toBeNull();
    });

    it("hides the score editors without the update permission", async () => {
      // With factors, so the factor editor would show if the permission were ignored.
      prepare([{ id: "impact", name: "Impact", weight: 3 }]);
      const view = renderPage(TeamTriagePage, meta, {
        permissions: { update: false },
      });
      await view.findByRole("rowheader", { name: "Export history" });
      expect(
        view.queryByRole("button", { name: /score/i }),
      ).not.toBeInTheDocument();
      expect(
        view.queryByRole("button", { name: /edit the factor values/i }),
      ).not.toBeInTheDocument();
    });
  });
});
