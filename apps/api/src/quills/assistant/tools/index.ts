// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { AiTool, ToolContext } from "../ai/tool";
import { addConversationTag } from "./add-conversation-tag";
import { addPrivateNote } from "./add-private-note";
import { assignConversationTeam } from "./assign-conversation-team";
import { searchHelpCenter } from "./search-help-center";
import { searchConversations } from "./search-conversations";
import { searchKnowledge } from "./search-knowledge";
import { setConversationAttribute } from "./set-conversation-attribute";
import { setConversationPriority } from "./set-conversation-priority";
import { setConversationStatus } from "./set-conversation-status";

// The assistant's tool registry (assistant/ai/README.md). Each tool lives in its own file with its
// action and approval policy; list it here. Connector tools (MCP) come from connector-calls.ts.

export const TOOL_NAMES = [
  "search_help_center",
  "search_knowledge",
  "search_conversations",
  "set_conversation_status",
  "set_conversation_priority",
  "add_conversation_tag",
  "assign_conversation_team",
  "set_conversation_attribute",
  "add_private_note",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export const readTools = {
  search_help_center: searchHelpCenter,
  search_knowledge: searchKnowledge,
  search_conversations: searchConversations,
};
export const writeTools = {
  set_conversation_status: setConversationStatus,
  set_conversation_priority: setConversationPriority,
  add_conversation_tag: addConversationTag,
  assign_conversation_team: assignConversationTeam,
  set_conversation_attribute: setConversationAttribute,
  add_private_note: addPrivateNote,
};
export type WriteToolName = keyof typeof writeTools;
export const isWriteTool = (name: string): name is WriteToolName =>
  Object.hasOwn(writeTools, name);
export const nativeTools: Record<ToolName, AiTool> = {
  ...readTools,
  ...writeTools,
};

/**
 * The tools the model may see in a turn: they fit the turn, an admin did not turn them off, and
 * the asking teammate holds their action now.
 */
export const offeredTools = (
  context: ToolContext,
  off: ReadonlySet<string>,
): AiTool[] =>
  TOOL_NAMES.map((name) => nativeTools[name]).filter(
    (tool) =>
      !off.has(tool.name) &&
      (tool.available?.(context) ?? true) &&
      context.actions.includes(tool.action),
  );

/** The tool catalogue as the settings page lists it. */
export const toolCatalogue = TOOL_NAMES.map((name) => {
  const tool = nativeTools[name];
  return tool.kind === "write"
    ? {
        name,
        kind: "write" as const,
        description: tool.description,
        requires: tool.action,
      }
    : {
        name,
        kind: "read" as const,
        description: tool.description,
        requires: "read" as const,
      };
});
