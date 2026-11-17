import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z } from "../../../openapi";
import {
  chatJson,
  requireAi,
  toHttp,
  untrusted,
  type Message,
} from "../../assistant/provider";
import { logUsage } from "../../assistant/runs";
import { defineQuillsRoute, type Database } from "../../framework/define-route";
import { notFound } from "../../feedback/visibility";
import {
  releaseAiBudget,
  reserveAiBudget,
  tokenCeiling,
} from "../../assistant/budget";
import {
  capabilities,
  forbidden,
  title,
  viewerFor,
  visibleBoards,
  type Customer,
  type Viewer,
} from "./viewer";

// AI help for the customer composer in the portal and the widget (RFC 0003 feature 4, issue #106).
// The model suggests a title from the customer's own words and picks one of the boards that take
// the caller's posts. Nothing is stored, and the customer's text is never rewritten: the customer
// confirms the title and board by submitting the post. The provider call holds no database connection.

const MAX_TOKENS = 300;
const answer = z.object({
  title: z.string().min(1),
  boardId: z.string().nullable().optional(),
});

/** The boards that take the caller's posts. A given board must be one of them. */
async function submittable(db: Database, viewer: Viewer, boardId?: string) {
  const visible = await visibleBoards(db, viewer);
  const boards = visible.filter(
    (board) => capabilities(viewer, board.access).canSubmit,
  );
  if (boardId && !visible.some((board) => board.id === boardId))
    throw notFound("Board");
  if (boardId && !boards.some((board) => board.id === boardId))
    throw forbidden("Submissions are not open to you on this board");
  if (!boards.length) throw forbidden("Submissions are not open to you");
  return boards;
}

export const improvePostDraft = (audience: Customer) =>
  defineQuillsRoute({
    audience,
    method: "post",
    path: `/${audience}/post-draft/improve`,
    operationId: `improveQuills${title(audience)}PostDraft`,
    summary: "Suggest a title and a board for a draft post",
    description:
      "The model writes a title from the customer's own words and picks one of the boards that take the caller's posts. The customer's text is not changed and nothing is saved. 409 when AI is not configured or the workspace reached its monthly AI limit, 502 when the provider fails.",
    action: "create",
    rateLimit: { limit: 10, windowSeconds: 600, per: "caller" },
    body: z
      .object({
        title: z.string().trim().max(200),
        details: z.string().trim().max(4000),
        boardId: flexibleToTypeIdSchema("board").optional(),
      })
      .refine((body) => body.title || body.details, {
        message: "Provide a title or details",
      }),
    prepare: async ({ db, caller, body }) => {
      // A closed portal or widget is 404 before the AI check, like every customer route.
      const viewer = await viewerFor(db, audience, caller);
      const boards = await submittable(db, viewer, body.boardId);
      requireAi();
      // shortcut: the first 50 boards by name reach the prompt; send a shortlist if workspaces have more.
      const shown = boards.slice(0, 50).map((board) => ({
        id: board.id,
        name: board.name,
        description: board.description?.slice(0, 200) ?? null,
      }));
      const messages: Message[] = [
        {
          role: "system",
          content: [
            "You help a customer write a feedback post. Write a short, clear title (at most 200 characters) for their feedback, in the language of their text.",
            "Use only what the customer wrote: keep their meaning, and never add facts, features, numbers or claims that are not in their text.",
            "Pick the board that fits best by its id, or null.",
            'Answer with one JSON object: {"title": string, "boardId": string | null}.',
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            untrusted(
              "draft",
              JSON.stringify({ title: body.title, details: body.details }),
            ),
            untrusted("boards", JSON.stringify(shown)),
          ].join("\n"),
        },
      ];
      const reservation = await reserveAiBudget(
        db,
        `${audience}_post_draft`,
        tokenCeiling(messages, MAX_TOKENS),
      );
      return { messages, reservation };
    },
    call: async ({ messages, reservation }) => ({
      ...(await chatJson(answer, messages, MAX_TOKENS).catch((error) => {
        throw toHttp(error);
      })),
      reservation,
    }),
    response: z.object({
      title: z.string().max(200),
      boardId: z.string().nullable(),
      boardName: z.string().nullable(),
    }),
    responseDescription: "The suggested title and board; nothing is saved",
    errors: {
      403: "Blocked account, no portal access, or submissions are not open to you",
      404: "Board not found",
      409: "AI is not configured, or the workspace reached its monthly AI limit",
      502: "The AI provider failed",
    },
    event: {
      none: "A suggestion changes no domain data; the usage log row is its record",
    },
    handler: async ({ db, caller, body, called }) => {
      const viewer = await viewerFor(db, audience, caller);
      const boards = await submittable(db, viewer, body.boardId);
      await releaseAiBudget(db, called.reservation);
      await logUsage(db, [
        {
          step: `${audience}_post_draft`,
          callType: "chat_completion",
          usage: called.usage,
        },
      ]);
      // Only a board that takes the caller's posts, never one the model made up.
      const chosen =
        boards.find((board) => board.id === called.value.boardId) ??
        boards.find((board) => board.id === body.boardId);
      return {
        title: called.value.title.trim().slice(0, 200),
        boardId: chosen?.id ?? null,
        boardName: chosen?.name ?? null,
      };
    },
  });

export default apiRouter().openapi(...improvePostDraft("portal"));
