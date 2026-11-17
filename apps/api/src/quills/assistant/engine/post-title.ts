import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { withQuillsSystemWorkspace } from "../../../database/quills/client";
import { boards } from "../../../database/quills/schema/boards";
import { boardProjects } from "../../../database/quills/schema/platform-links";
import { posts } from "../../../database/quills/schema/posts";
import { recordQuillsChange } from "../../events";
import { aiConfig, chatJson, untrusted } from "../provider";
import { logUsage } from "../runs";
import { nothing, type Work } from "./shared";

// A customer who types one sentence gets a short title and the right board (gap G-11). The
// request recorded that the post had no title and no chosen board; this work asks the model after
// commit. It offers only live boards with the same access rules and segments as the board the post
// landed on, so the author may submit on each. Without AI the first line stays the title.

const answer = z.object({
  title: z.string().trim().min(3).max(120),
  board: z.number().int().min(0).nullable(),
});

/** post.created for a customer post without a title: an AI title, and maybe a like board. */
export const titleUntitledPost: Work = async (workspaceId, event) => {
  const payload = event.payload as Record<string, string>;
  if (payload.untitled !== "true" || !aiConfig()) return nothing;
  const read = await withQuillsSystemWorkspace(workspaceId, async (db) => {
    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        boardId: posts.boardId,
      })
      .from(posts)
      .where(
        and(eq(posts.id, event.entityId as never), isNull(posts.deletedAt)),
      );
    if (!post) return { post, options: [] };
    const live = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        access: boards.access,
        segments: boards.visibleSegmentIds,
      })
      .from(boards)
      .where(
        and(
          isNull(boards.deletedAt),
          sql`not exists (select 1 from ${boardProjects} where ${eq(boardProjects.boardId, boards.id)})`,
        ),
      );
    const home = live.find((board) => board.id === post.boardId);
    const rules = (board: (typeof live)[number]) =>
      JSON.stringify([board.access, board.segments]);
    const options = home
      ? live.filter((board) => rules(board) === rules(home)).slice(0, 15)
      : [];
    return { post, options };
  });
  const { post, options } = read;
  if (!post) return nothing;
  const reply = await chatJson(
    answer,
    [
      {
        role: "system",
        content:
          'Write a short, specific title (at most 80 characters) for a customer feedback request, in the language of the request, and pick the board it belongs on. Answer with one JSON object: {"title": string, "board": the number of the best board, or null}.',
      },
      {
        role: "user",
        content: `${untrusted("request", post.content)}\n${untrusted(
          "boards",
          options
            .map(
              (board, i) =>
                `${i}: ${board.name}${board.description ? ` (${board.description})` : ""}`,
            )
            .join("\n"),
        )}`,
      },
    ],
    200,
  );
  const board =
    reply.value.board === null ? undefined : options[reply.value.board];
  return async (db) => {
    await logUsage(db, [
      {
        step: "post_title",
        callType: "chat_completion",
        usage: reply.usage,
        postId: post.id,
      },
    ]);
    // Only while nobody changed the title or the board since the post was created.
    const changed = await db
      .update(posts)
      .set({
        title: reply.value.title.slice(0, 200),
        ...(board && { boardId: board.id }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.id, post.id),
          eq(posts.title, post.title),
          eq(posts.boardId, post.boardId),
        ),
      )
      .returning({ id: posts.id });
    if (changed.length)
      await recordQuillsChange(db, null, {
        type: "post.updated",
        entityType: "post",
        entityId: post.id,
        payload: {
          fields: board && board.id !== post.boardId ? "title,board" : "title",
          source: "ai",
        },
      });
  };
};
