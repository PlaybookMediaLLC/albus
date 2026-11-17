import { and, eq, isNull, sql } from "drizzle-orm";
import type { PostId } from "@kaneo/ids";
import { principal, user as customer } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { kvStore } from "../../database/quills/schema/kv";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { postComments, posts } from "../../database/quills/schema/posts";
import type { Database } from "../framework/define-route";
import { countComment } from "../portal/feedback/comments";
import { accessOf, held, moderationFor } from "../portal/feedback/viewer";

// A reply to a feedback notification mail (gap G-27). The mail went to the post's signed reply
// address (framework/signed.ts postReplyAddress); the reply becomes a comment by the subscriber
// whose address sent it. Anyone else, a locked or merged post, or a repeated Message-ID changes
// nothing. The comment follows the workspace's moderation rules like one from the widget.

/** The new text of a reply: quoted history and signatures after a separator are left out. */
export function replyText(text: string) {
  const lines: string[] = [];
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    if (
      /^On .+wrote:\s*$/i.test(line) ||
      /^-{2,}\s*(Original Message|Forwarded message)/i.test(line) ||
      /^_{5,}\s*$/.test(line) ||
      /^(From|De|Von):\s/.test(line)
    )
      break;
    if (!line.startsWith(">")) lines.push(line);
  }
  return lines.join("\n").trim();
}

export type MailReply =
  | { status: "duplicate" | "empty" | "rejected" | "from_mismatch" }
  | { status: "received"; commentId: string; postId: string };

export async function commentByMail(
  db: Database,
  input: {
    postId: PostId;
    address: string;
    text: string;
    emailMessageId?: string;
  },
): Promise<MailReply> {
  const content = replyText(input.text).slice(0, 10_000);
  if (!content) return { status: "empty" };
  const [post] = await db
    .select({
      id: posts.id,
      access: boards.access,
      locked: posts.isCommentsLocked,
      merged: posts.canonicalPostId,
      state: posts.moderationState,
    })
    .from(posts)
    .innerJoin(boards, eq(boards.id, posts.boardId))
    .where(
      and(
        eq(posts.id, input.postId),
        isNull(posts.deletedAt),
        isNull(boards.deletedAt),
      ),
    );
  if (!post || post.locked || post.merged || post.state !== "published")
    return { status: "rejected" };
  // The sender must be a customer who follows the post: the only people this mail went to.
  const [person] = await db
    .select({ id: principal.id })
    .from(postSubscriptions)
    .innerJoin(principal, eq(principal.id, postSubscriptions.principalId))
    .innerJoin(customer, eq(customer.id, principal.userId))
    .where(
      and(
        eq(postSubscriptions.postId, post.id),
        eq(principal.type, "user"),
        isNull(principal.blockedAt),
        sql`lower(${customer.email}) = ${input.address.toLowerCase()}`,
      ),
    )
    .limit(1);
  if (!person) return { status: "from_mismatch" };
  if (input.emailMessageId) {
    const [claimed] = await db
      .insert(kvStore)
      .values({
        workspaceKey: "_",
        key: `email_comment:${input.emailMessageId}`,
        value: { postId: post.id },
        expiresAt: sql`now() + interval '30 days'`,
      })
      .onConflictDoNothing()
      .returning({ key: kvStore.key });
    if (!claimed) return { status: "duplicate" };
  }
  const pending = held(
    await moderationFor(db),
    accessOf(post.access),
    "comment",
    content,
  );
  const [row] = await db
    .insert(postComments)
    .values({
      postId: post.id,
      principalId: person.id,
      content,
      isTeamMember: false,
      isPrivate: false,
      moderationState: pending ? "pending" : "published",
    })
    .returning({ id: postComments.id });
  if (!pending) await countComment(db, post.id, person.id, 1);
  return { status: "received", commentId: row!.id, postId: post.id };
}
