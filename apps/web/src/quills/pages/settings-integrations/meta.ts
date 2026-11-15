import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-integrations",
  feature: "settings-connections",
  route: "/feedback/$workspaceId/settings/integrations",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsIntegrationCatalog",
    "listQuillsIntegrations",
    "deleteQuillsIntegration",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
