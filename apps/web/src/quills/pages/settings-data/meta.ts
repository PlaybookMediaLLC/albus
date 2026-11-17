import type { PageMeta } from "../../core/types";
export const meta = {
  id: "settings-data",
  feature: "settings-connections",
  route: "/feedback/$workspaceId/settings/data",
  audience: "teammate",
  mailLinked: false,
  token: "none",
  operations: [
    "listQuillsImportRuns",
    "listQuillsExportRuns",
    "listQuillsSettings",
    "listQuillsBoards",
    "createQuillsUpload",
    "createQuillsImport",
    "importQuillsCompanies",
    "createQuillsExportWorkspace",
    "wipeQuillsWorkspaceData",
  ],
  states: ["loading", "failed", "ready", "done"],
} satisfies PageMeta;
