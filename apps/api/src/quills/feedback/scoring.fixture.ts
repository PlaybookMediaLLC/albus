import { fixture } from "../framework/contract";
import { seed, seedWith, softDeletePost, type Ids } from "./seed.fixture";
import { writeSettingsKey } from "./settings-json";

/** A's posts can be scored on an "impact" factor. */
const scored = seedWith((db) =>
  writeSettingsKey(db, "metadata", "scoringFactors", () => [
    { id: "impact", name: "Impact", weight: 3 },
  ]),
);

export const getQuillsScoringFactors = fixture({ seed, valid: () => ({}) });
export const setQuillsScoringFactors = fixture({
  seed,
  valid: () => ({
    body: {
      factors: [
        { name: "Impact", weight: 3 },
        { name: "Effort", weight: -2 },
      ],
    },
  }),
});
export const setQuillsPostFactorScores = fixture({
  seed: scored,
  valid: ({ a }: Ids) => ({
    params: { postId: a.postId },
    body: { values: [{ factorId: "impact", value: 7 }] },
  }),
  foreign: ({ b }: Ids) => ({ postId: b.postId }),
  softDelete: softDeletePost,
});
