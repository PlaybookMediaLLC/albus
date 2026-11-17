import { describe, expect, it } from "vite-plus/test";
import { protect, restore, termsIn } from "./protected-terms";

describe("protected terms", () => {
  it("keeps only the terms in the text, longest first", () => {
    expect(
      termsIn(
        ["Kaneo", "Kaneo Cloud", " ", "Absent"],
        ["Try Kaneo Cloud and Kaneo"],
      ),
    ).toEqual(["Kaneo Cloud", "Kaneo"]);
  });

  it("swaps each term for a placeholder and puts it back unchanged", () => {
    const terms = termsIn(
      ["Kaneo Cloud", "Kaneo"],
      ["Kaneo Cloud beats Kaneo"],
    );
    const sent = protect("Kaneo Cloud beats Kaneo", terms);
    expect(sent).toBe("⟦0⟧ beats ⟦1⟧");
    expect(sent).not.toContain("Kaneo");
    expect(restore(sent, "⟦0⟧ schlägt ⟦1⟧", terms)).toBe(
      "Kaneo Cloud schlägt Kaneo",
    );
  });

  it("never matches a term inside a placeholder", () => {
    const terms = termsIn(
      ["Plan 10", "0", "1"],
      ["Plan 10 has 1 seat, 0 left"],
    );
    const sent = protect("Plan 10 has 1 seat, 0 left", terms);
    expect(sent).toBe("⟦0⟧ has ⟦2⟧ seat, ⟦1⟧ left");
    expect(restore(sent, sent, terms)).toBe("Plan 10 has 1 seat, 0 left");
  });

  it("refuses a translation that lost, repeated or invented a placeholder", () => {
    const terms = ["Kaneo"];
    const sent = protect("Use Kaneo", terms);
    expect(restore(sent, "Benutze Kaneo-App", terms)).toBeNull();
    expect(restore(sent, "⟦0⟧ ⟦0⟧", terms)).toBeNull();
    expect(restore(sent, "⟦0⟧ ⟦1⟧", terms)).toBeNull();
    expect(restore("No terms", "Keine ⟦0⟧", [])).toBeNull();
    expect(restore("No terms", "Keine Begriffe", [])).toBe("Keine Begriffe");
  });
});
