import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-branding",
  feature: "settings-workspace",
  route: "/feedback/$workspaceId/settings/branding",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsBrandingSettings",
    "getQuillsPublicPortalConfig",
    "getQuillsPoweredBy",
    "listQuillsCustomDomains",
    "updateQuillsBrandingSettings",
    "createQuillsSettingsUpload",
    "saveQuillsLogoKey",
    "deleteQuillsLogo",
    "setQuillsPoweredBy",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
