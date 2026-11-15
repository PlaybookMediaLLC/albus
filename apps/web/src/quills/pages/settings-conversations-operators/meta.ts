import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-operators",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/operators",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsPrincipals",
    "setQuillsAgentAvailability",
    "listQuillsTeams",
    "updateQuillsTeam",
    "updateQuillsTeamBinding",
    "deleteQuillsTeam",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
