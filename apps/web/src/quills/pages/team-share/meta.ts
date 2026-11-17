import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-share",
  feature: "team-share",
  route: "/feedback/$workspaceId/share",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsSettings",
    "getQuillsPortalSettings",
    "updateQuillsPortalSettings",
    "listQuillsCustomDomains",
    "mintQuillsWidgetInstallCode",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
