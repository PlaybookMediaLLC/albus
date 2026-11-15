import type { PageMeta } from "../../core/types";
export const meta = {
  id: "team-members",
  feature: "team-members",
  route: "/feedback/$workspaceId/members",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: ["listQuillsUsers"],
  states: ["loading", "failed", "ready"],
} satisfies PageMeta;
