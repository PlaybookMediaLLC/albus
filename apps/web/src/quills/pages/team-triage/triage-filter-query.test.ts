import { describe, expect, it } from "vite-plus/test";
import { filterQuery, noFilters } from "./triage-filter-query";

describe("filterQuery", () => {
  it("sends each set filter, with revenue in cents", () => {
    expect(
      filterQuery({
        minVotes: 2,
        minMrr: 1250.5,
        minScore: -3,
        segmentId: "segment_enterprise",
      }),
    ).toEqual({
      minVotes: "2",
      minMrrCents: "125050",
      minScore: "-3",
      segmentIds: "segment_enterprise",
    });
  });

  it("sends no filter for empty fields", () => {
    expect(filterQuery(noFilters)).toEqual({});
  });
});
