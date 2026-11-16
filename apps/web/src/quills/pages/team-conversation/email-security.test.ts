import { describe, expect, it } from "vite-plus/test";
import { emailSecurityOf } from "./email-security";

type Messages = NonNullable<Parameters<typeof emailSecurityOf>[0]>;
const message = (id: string, spf: "pass" | "fail" | null) =>
  ({
    id,
    createdAt: `2026-11-0${id}T10:00:00.000Z`,
    emailAuth: spf ? { spf, dkim: "pass", dmarc: "pass" } : null,
  }) as unknown as Messages[number];

describe("emailSecurityOf", () => {
  it("takes the newest message with checks", () => {
    expect(
      emailSecurityOf([
        message("3", null),
        message("2", "fail"),
        message("1", "pass"),
      ]),
    ).toEqual({
      auth: { spf: "fail", dkim: "pass", dmarc: "pass" },
      receivedAt: "2026-11-02T10:00:00.000Z",
    });
  });

  it("is null without checks", () => {
    expect(emailSecurityOf([message("1", null)])).toBeNull();
    expect(emailSecurityOf()).toBeNull();
  });
});
