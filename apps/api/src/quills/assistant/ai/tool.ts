// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { z } from "../../../openapi";
import type { Database, QuillsActor } from "../../framework/define-route";
import type { Conversation } from "../../support/conversation-model";

// The tool template. A tool is tied to the workspace (it reads and writes only through the scoped
// database it gets), to the asking teammate (the model sees it only while that teammate holds its
// action), to the agent that offers it, and to its eval (assistant_tool_calls records each call).

/** Who asks and about what: every tool call runs for this teammate in this workspace. */
export type ToolContext = {
  workspaceId: string;
  /** The asking teammate. */
  principalId: string;
  /** The asking teammate's Quills actions when the turn starts. */
  actions: readonly string[];
  conversationId: string | null;
  ticketId: string | null;
  /** The assistant's knowledge settings for this agent. */
  knowledge: { helpCenter: boolean; documents: boolean };
};
export type { Conversation };
/** A change that a write tool made, recorded as a Quills event. */
export type ToolChange = {
  type:
    | "conversation.status_changed"
    | "conversation.priority_changed"
    | "conversation.tags_changed"
    | "conversation.assigned"
    | "conversation.attribute_changed"
    | "message.note_created";
  entityType: "conversation" | "conversation_message";
  entityId: string;
  payload: Record<string, string>;
};
/** What a read tool found: the text for the model, a short summary for the audit, its sources. */
export type ToolResult = {
  content: string;
  summary: string;
  sources?: {
    type: "article" | "snippet" | "document" | "webpage";
    id: string;
    title: string;
    excerpt: string;
  }[];
};

type Common<A extends z.ZodObject> = {
  name: string;
  description: string;
  args: A;
  /**
   * The Quills action the asking teammate must hold now, the same one as the teammate's own route.
   * Without it the model never sees the tool. A `required` tool needs `update`: the approval route
   * checks that action.
   */
  action: "read" | "create" | "update";
  /** Whether the tool fits this turn, for example only for a conversation. */
  available?(context: ToolContext): boolean;
};
export type ReadTool<A extends z.ZodObject = z.ZodObject> = Common<A> & {
  kind: "read";
  /** Runs at once, in a system-scoped read of the workspace, showing only what the teammate may read. */
  run(
    db: Database,
    context: ToolContext,
    args: z.output<A>,
  ): Promise<ToolResult>;
};
export type WriteTool<A extends z.ZodObject = z.ZodObject> = Common<A> & {
  kind: "write";
  /**
   * `required`: the call becomes a pending action, and it runs only when a teammate approves it, in
   * that teammate's request (assistant/pending-actions.ts). `auto`: it runs as the asking teammate
   * in the job's own transaction when the turn ends, after a fresh permission check. Use `auto`
   * only for a change that is internal to the team and easy to undo.
   */
  approval: "required" | "auto";
  /** What the teammate approves or what the audit shows, in one sentence. */
  summary(args: z.output<A>): string;
  execute(
    db: Database,
    actor: QuillsActor,
    conversation: Conversation,
    args: z.output<A>,
  ): Promise<ToolChange | null>;
};
export type AiTool = ReadTool | WriteTool;

export const defineReadTool = <A extends z.ZodObject>(
  tool: Omit<ReadTool<A>, "kind">,
): ReadTool<A> => ({
  kind: "read",
  ...tool,
});
export const defineWriteTool = <A extends z.ZodObject>(
  tool: Omit<WriteTool<A>, "kind">,
): WriteTool<A> => ({
  kind: "write",
  ...tool,
});
/** The change event of a write tool on a conversation. */
export const conversationChange = (
  conversation: Conversation,
  type: ToolChange["type"],
  payload: Record<string, string> = {},
): ToolChange => ({
  type,
  entityType: "conversation",
  entityId: conversation.id,
  payload,
});
