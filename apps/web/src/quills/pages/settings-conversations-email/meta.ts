import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-conversations-email",
  feature: "settings-conversations",
  route: "/feedback/$workspaceId/settings/conversations/email",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "getQuillsEmailChannelStatus",
    "getQuillsEmailChannelConfig",
    "listQuillsRecentEmailLog",
    "setQuillsInboundForwarding",
    "clearQuillsInboundForwarding",
    "setQuillsInboundTrust",
    "createQuillsSendingAddress",
    "deleteQuillsChannelAccount",
    "restartQuillsSendingDomainChecks",
    "deleteQuillsSendingDomain",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
