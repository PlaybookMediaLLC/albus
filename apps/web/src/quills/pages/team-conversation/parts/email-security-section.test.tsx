import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { EmailSecuritySection } from "./email-security-section";

describe("EmailSecuritySection", () => {
  it("names each check with its result and folds", () => {
    const view = renderComponent(
      <EmailSecuritySection
        auth={{ spf: "pass", dkim: "fail", dmarc: "none" }}
        receivedAt={new Date(Date.now() - 16 * 86_400_000).toISOString()}
      />,
    );
    const checks = view.getAllByRole("listitem");
    expect(checks.map((check) => check.textContent)).toEqual([
      "SPFPassed",
      "DKIMFailed",
      "DMARCNo result",
    ]);
    const toggle = view.getByRole("button", { name: "Email security" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(checks[0]).not.toBeVisible();
    // The time sits beside the heading, outside the toggle, so it stays in view.
    expect(view.getByText("16d ago")).toBeVisible();
  });
});
