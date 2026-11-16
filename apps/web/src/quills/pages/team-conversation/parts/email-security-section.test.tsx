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
    const summary = view.getByText("Email security");
    expect(summary).toHaveTextContent("16d ago");
    const details = summary.closest("details")!;
    expect(details.open).toBe(true);
    fireEvent.click(summary);
    expect(details.open).toBe(false);
  });
});
