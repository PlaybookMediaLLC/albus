import { describe, expect, it } from "vite-plus/test";
import type { PrincipalId } from "@kaneo/ids";
import {
  PREVIEW_EXACT,
  updateCountsOf,
  type UpdateCandidates,
} from "./post-update";

const channels = { page: true, email: true, conversations: true, slack: true };
const candidates = (followerCount: number) =>
  ({
    followerCount,
    conversations: [{}, {}],
    slack: 1,
  }) as unknown as UpdateCandidates;
const recipients = ["principal_a", "principal_b"] as PrincipalId[];

describe("updateCountsOf", () => {
  it("counts the checked recipients up to PREVIEW_EXACT followers", () => {
    expect(updateCountsOf(candidates(3), recipients, channels)).toEqual({
      page: 1,
      email: 2,
      emailEstimated: false,
      conversations: 2,
      slack: 1,
    });
  });

  it("counts the matching followers above it, as an estimate", () => {
    expect(
      updateCountsOf(candidates(PREVIEW_EXACT + 1), [], channels),
    ).toMatchObject({ email: PREVIEW_EXACT + 1, emailEstimated: true });
  });

  it("counts no mail and no Slack without their channels", () => {
    expect(
      updateCountsOf(candidates(PREVIEW_EXACT + 1), [], {
        ...channels,
        email: false,
        page: false,
      }),
    ).toMatchObject({ email: 0, emailEstimated: false, slack: 0, page: 0 });
  });
});
