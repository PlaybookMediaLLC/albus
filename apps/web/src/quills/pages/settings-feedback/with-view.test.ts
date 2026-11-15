import { describe, expect, it } from "vite-plus/test";
import { withView } from "./with-view";

const access = {
  view: "anonymous" as const,
  vote: "authenticated" as const,
  comment: "segments" as const,
  submit: "anonymous" as const,
  segments: { view: [], vote: [], comment: ["segment_1"], submit: [] },
  replyPolicy: "anyone" as const,
};

describe("withView", () => {
  it("makes each more open action as strict as a stricter view", () => {
    expect(withView(access, "team")).toEqual({
      ...access,
      view: "team",
      vote: "team",
      comment: "team",
      submit: "team",
    });
  });

  it("keeps the stricter actions when the view opens up", () => {
    expect(withView({ ...access, view: "team" }, "authenticated")).toEqual({
      ...access,
      view: "authenticated",
      submit: "authenticated",
    });
  });
});
