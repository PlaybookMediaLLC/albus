import type { PageMeta } from "../../core/types";
export const meta = {
  id: "help-center-locale",
  feature: "help-center",
  route: "/portal/$workspaceId/hc/$locale",
  audience: "portal",
  mailLinked: true,
  token: "none",
  operations: ["getQuillsPublicHelpCenter", "searchQuillsPublicHelpCenter"],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
