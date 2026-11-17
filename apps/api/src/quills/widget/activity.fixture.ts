import { inAppNotifications } from "../../database/quills/schema/notifications";
import { fixture } from "../framework/contract";
import { world } from "../portal/feedback/seed.fixture";
import { enableWidget } from "./seed.fixture";

// An identified visitor with one unread reply on a visible post of workspace A.
const seed = async (env: Parameters<typeof world>[0]) => {
  await enableWidget(env, env.a);
  const posts = await world(env, env.a);
  const visitor = await env.widgetVisitor(env.a);
  const [row] = await env.scoped(env.a, (db) =>
    db
      .insert(inAppNotifications)
      .values({
        principalId: visitor.principalId as never,
        type: "comment_created",
        title: "Someone commented",
        body: env.id("reply"),
        postId: posts.postId as never,
      })
      .returning({ id: inAppNotifications.id }),
  );
  const b = await world(env, env.b);
  const outsider = await env.portalCustomer(env.b, env.customerB);
  const [foreign] = await env.scoped(env.b, (db) =>
    db
      .insert(inAppNotifications)
      .values({
        principalId: outsider.principalId as never,
        type: "comment_created",
        title: "Someone commented",
        postId: b.postId as never,
      })
      .returning({ id: inAppNotifications.id }),
  );
  return {
    token: visitor.token,
    activityId: row!.id,
    foreignActivityId: foreign!.id,
    b,
  };
};

export const listQuillsWidgetActivity = fixture({
  seed,
  valid: (ids) => ({ bearer: ids.token }),
});

export const markQuillsWidgetActivityRead = fixture({
  seed,
  valid: (ids) => ({
    bearer: ids.token,
    params: { activityId: ids.activityId },
  }),
  foreign: (ids) => ({ activityId: ids.foreignActivityId }),
});
