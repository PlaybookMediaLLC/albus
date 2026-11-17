import { describe, expect, it } from "vite-plus/test";
import {
  hasSensitive,
  looksLikeSpam,
  sensitiveKinds,
  spamSignals,
} from "./content-checks";

describe("content checks", () => {
  it("marks text with two spam signals as spam, and leaves normal feedback alone", () => {
    expect(
      looksLikeSpam(
        "BUY NOW CHEAP CASINO BONUS http://a.test http://b.test http://c.test",
      ),
    ).toBe(true);
    expect(spamSignals("FREE MONEY!!!!!!!!!! click here")).toContain("phrases");
    expect(looksLikeSpam("Please add CSV export to the board view.")).toBe(
      false,
    );
    // One signal alone is not enough: a shouted bug report stays.
    expect(looksLikeSpam("THE EXPORT BUTTON IS BROKEN AGAIN TODAY")).toBe(
      false,
    );
  });

  it("finds emails, card numbers, phone numbers, IBANs and secrets", () => {
    expect(sensitiveKinds("mail me at ada@example.test")).toEqual(["email"]);
    expect(sensitiveKinds("card 4242 4242 4242 4242 exp 12/30")).toContain(
      "card",
    );
    // A long number that fails the Luhn check is not a card.
    expect(sensitiveKinds("order 1234 5678 9012 3456")).not.toContain("card");
    expect(sensitiveKinds("call +1 415-555-0100")).toContain("phone");
    expect(sensitiveKinds("IBAN DE89 3704 0044 0532 0130 00")).toContain(
      "iban",
    );
    expect(sensitiveKinds("key sk_live_abcdefghijklmnop")).toContain("secret");
    expect(hasSensitive("The roadmap view is slow on Safari 17.")).toBe(false);
  });
});
