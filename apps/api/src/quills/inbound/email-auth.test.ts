import { describe, expect, it } from "vite-plus/test";
import { parseAuthenticationResults, trustedEmailAuth } from "./email-auth";

const receiver =
  "amazonses.com;\r\n spf=pass (spf: domain of example.com designates 1.2.3.4 as permitted sender; ok)" +
  " client-ip=1.2.3.4; envelope-from=a@example.com;\r\n dkim=pass header.i=@example.com;" +
  " dmarc=pass header.from=example.com;";

describe("parseAuthenticationResults", () => {
  it("reads the authserv-id and each result, without comments", () => {
    expect(parseAuthenticationResults(receiver)).toEqual({
      authservId: "amazonses.com",
      auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    });
  });

  it("maps negative results to fail and the rest to none", () => {
    expect(
      parseAuthenticationResults(
        "mx.example 1; spf=softfail; dkim=neutral (nested (comment)); dmarc=temperror",
      ),
    ).toEqual({
      authservId: "mx.example",
      auth: { spf: "fail", dkim: "none", dmarc: "none" },
    });
    expect(parseAuthenticationResults("mx.example; none").auth).toEqual({
      spf: "none",
      dkim: "none",
      dmarc: "none",
    });
  });

  it("passes DKIM when one of several signatures passes", () => {
    expect(
      parseAuthenticationResults(
        "mx.example; dkim=fail header.d=a.test; dkim=pass header.d=b.test",
      ).auth.dkim,
    ).toBe("pass");
  });

  it("ignores results inside a quoted value and never upgrades SPF or DMARC", () => {
    expect(
      parseAuthenticationResults(
        'mx.example; spf=fail smtp.mailfrom="x;dmarc=pass;spf=pass;dkim=pass"@evil.test; dkim=none; dmarc=fail',
      ).auth,
    ).toEqual({ spf: "fail", dkim: "none", dmarc: "fail" });
    expect(
      parseAuthenticationResults("mx.example; dmarc=fail; dmarc=pass").auth
        .dmarc,
    ).toBe("fail");
  });
});

describe("trustedEmailAuth", () => {
  const forged = "amazonses.com.evil.test; spf=pass; dkim=pass; dmarc=pass";

  it("takes the first header of the trusted receiver and ignores the sender's own", () => {
    const fake = "attacker.test; spf=pass; dkim=pass; dmarc=pass";
    expect(
      trustedEmailAuth(
        [fake, "AmazonSES.com; spf=fail; dkim=pass; dmarc=fail", receiver],
        "amazonses.com",
      ),
    ).toEqual({ spf: "fail", dkim: "pass", dmarc: "fail" });
    expect(trustedEmailAuth([forged, fake], "amazonses.com")).toBeNull();
  });

  it("counts nothing without a trusted ID", () => {
    expect(trustedEmailAuth([receiver], "")).toBeNull();
    expect(trustedEmailAuth([receiver], "  ")).toBeNull();
  });
});
