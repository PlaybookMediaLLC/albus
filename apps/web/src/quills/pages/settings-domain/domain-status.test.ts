import { describe, expect, it } from "vite-plus/test";
import { domainStatus } from "./domain-status";

describe("domainStatus", () => {
  it("shows an active domain as active, whatever the last check said", () => {
    expect(domainStatus({ active: true, checkResult: "missing" })).toEqual({
      tone: "success",
      key: "settings-workspace.domain.active",
    });
  });
  it("shows a domain before its first check as pending", () => {
    expect(domainStatus({ active: false, checkResult: null }).tone).toBe(
      "warning",
    );
  });
  it("shows the failed check of an inactive domain", () => {
    expect(domainStatus({ active: false, checkResult: "missing" }).key).toBe(
      "settings-workspace.domain.missing",
    );
    expect(domainStatus({ active: false, checkResult: "unanswered" }).key).toBe(
      "settings-workspace.domain.unanswered",
    );
  });
});
