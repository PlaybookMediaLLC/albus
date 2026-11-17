import type { PageMeta } from "../../core/types";
export const meta = {
  id: "status",
  feature: "status",
  route: "/portal/$workspaceId/status",
  audience: "portal",
  mailLinked: true,
  token: "none",
  operations: [
    "getQuillsPublicStatusPage",
    "listQuillsPublicStatusHistory",
    "getQuillsPublicStatusUptime",
  ],
  states: ["loading", "failed", "ready"],
} satisfies PageMeta;
