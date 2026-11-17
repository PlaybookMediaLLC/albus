import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import type { PostId, TypeId } from "@kaneo/ids";
import {
  withQuillsSystemWorkspace,
  type Database,
} from "../../../database/quills/client";
import { principal } from "../../../database/quills/schema/auth";
import { events } from "../../../database/quills/schema/events";
import type { JobQueueRow } from "../../../database/quills/schema/job-queue";
import { postUpdates } from "../../../database/quills/schema/post-updates";
import {
  followers,
  followerWhere,
  type UpdateChannels,
} from "../../integrations/post-update";
import type { DeliveryEvent } from "../fanout";
import { enqueueQuillsJob, finishQuillsJob } from "../queue";

// The mail of one "send update" (#92), in pages, so an update reaches every follower: each page queues
// the next PAGE followers in principal order, one mail job each, and the page after them. The mail
// job (handlers/mail.ts) checks the preference, the address and the request's visibility at send time.

export const UPDATE_MAIL_PAGE = 500;

const pageSchema = z
  .object({
    updateMail: z.string().min(1).max(200),
    after: z.string().min(1).max(200).optional(),
  })
  .strict();

/** Fan-out step for `post.update_sent`: the first page, after the send committed. */
export async function updateMailDue(db: Database, event: DeliveryEvent) {
  if (event.type !== "post.update_sent") return;
  await enqueueQuillsJob(
    db,
    "quills.mail",
    { updateMail: event.eventId },
    `update-mail:${event.eventId}`,
    5,
  );
}

/** One page of the update's mail. `size` is for tests. */
export async function runUpdateMailPage(
  workspaceId: string,
  job: JobQueueRow,
  size = UPDATE_MAIL_PAGE,
) {
  const { updateMail: eventId, after } = pageSchema.parse(job.payload);
  await withQuillsSystemWorkspace(workspaceId, async (db) => {
    const [event] = await db
      .select({ payload: events.payload })
      .from(events)
      .where(eq(events.eventId, eventId));
    const payload = (event?.payload ?? {}) as Record<string, string>;
    const [update] = payload.updateId
      ? await db
          .select({
            postId: postUpdates.postId,
            channels: postUpdates.channels,
            segmentIds: postUpdates.segmentIds,
            languages: postUpdates.languages,
          })
          .from(postUpdates)
          .where(eq(postUpdates.id, payload.updateId))
      : [];
    if (update && (update.channels as UpdateChannels).email) {
      const replied = payload.replied ? payload.replied.split(",") : [];
      const page = await followers(db)
        .where(
          and(
            followerWhere(
              update.postId as PostId,
              {
                segmentIds: update.segmentIds as TypeId<"segment">[],
                languages: update.languages,
              },
              replied,
            ),
            after
              ? gt(principal.id, after as typeof principal.id._.data)
              : undefined,
          ),
        )
        .orderBy(principal.id)
        .limit(size);
      for (const { principalId } of page)
        await enqueueQuillsJob(
          db,
          "quills.mail",
          { eventId, principalId },
          `${eventId}:${principalId}`,
          5,
        );
      const last = page.at(-1)?.principalId;
      if (page.length === size && last)
        await enqueueQuillsJob(
          db,
          "quills.mail",
          { updateMail: eventId, after: last },
          `update-mail:${eventId}:${last}`,
          5,
        );
    }
    await finishQuillsJob(db, job.id, job.leaseToken!);
  });
}
