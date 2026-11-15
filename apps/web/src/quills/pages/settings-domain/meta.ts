import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-domain",
  feature: "settings-workspace",
  route: "/feedback/$workspaceId/settings/domain",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsCustomDomains",
    "listQuillsSettings",
    "setQuillsPortalDomain",
    "verifyQuillsPortalDomain",
    "removeQuillsPortalDomain",
    "setQuillsHelpCenterDomain",
    "verifyQuillsHelpCenterDomain",
    "removeQuillsHelpCenterDomain",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
