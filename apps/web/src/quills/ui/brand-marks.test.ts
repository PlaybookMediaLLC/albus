import { describe, expect, it } from "vite-plus/test";
import { connectors } from "../pages/settings-integrations/connectors";
import { brandMarks } from "./brand-marks";

describe("brandMarks", () => {
  it("has a mark for every share network and every integration but Freshdesk", () => {
    const missing = [
      "x",
      "linkedin",
      "facebook",
      "reddit",
      ...Object.keys(connectors),
    ].filter((id) => !brandMarks[id]);
    expect(missing).toEqual(["freshdesk"]);
  });

  it("keeps each mark to plain paths and hex colors", () => {
    for (const mark of Object.values(brandMarks)) {
      expect(mark.paths.length).toBeGreaterThan(0);
      for (const path of mark.paths) {
        const [fill, d] = typeof path === "string" ? [mark.color, path] : path;
        if (fill) expect(fill).toMatch(/^#(?:[0-9a-f]{3}){1,2}$/i);
        expect(d).toMatch(/^[Mm][\d\s.,a-zA-Z-]+$/);
      }
    }
  });
});
