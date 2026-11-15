import type { ListCustomDomainsResponse } from "../../api/team/list-custom-domains";
import type { StatusTone } from "../../ui/upstream";

export type CustomDomain = ListCustomDomainsResponse["domains"][number];

/**
 * The badge of a custom domain. A domain serves only when it is active. Before the first
 * DNS check, `checkResult` is null.
 */
export function domainStatus(
  domain: Pick<CustomDomain, "active" | "checkResult">,
): { tone: StatusTone; key: string } {
  if (domain.active)
    return { tone: "success", key: "settings-workspace.domain.active" };
  if (domain.checkResult === "missing")
    return { tone: "destructive", key: "settings-workspace.domain.missing" };
  if (domain.checkResult === "unanswered")
    return { tone: "destructive", key: "settings-workspace.domain.unanswered" };
  return { tone: "warning", key: "settings-workspace.domain.pending" };
}
