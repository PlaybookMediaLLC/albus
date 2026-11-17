import { eq } from "drizzle-orm";
import type { PostId } from "@kaneo/ids";
import { user as customer } from "../../database/quills/schema/auth";
import { postVotes } from "../../database/quills/schema/posts";
import { fixture, type ContractEnv } from "../framework/contract";
import {
  enablePortal,
  verifyEmail,
  widgetProfile,
} from "./customer-seed.fixture";

/** Who holds the vote of the seeded widget profile. */
const voters = (env: ContractEnv, ids: { postId: string }) =>
  env.scoped(env.a, (db) =>
    db
      .select({ principalId: postVotes.principalId })
      .from(postVotes)
      .where(eq(postVotes.postId, ids.postId as PostId)),
  );

export const linkQuillsPortalWidgetProfile = fixture({
  seed: async (env) => {
    await enablePortal(env, env.a);
    await verifyEmail(env, env.customerA);
    // An earlier check linked customer A; a profile that holds another sub is never linked again.
    await env.scoped(env.a, (db) =>
      db
        .update(customer)
        .set({ externalId: null })
        .where(eq(customer.kaneoUserId, env.customerA)),
    );
    return widgetProfile(env, env.a);
  },
  valid: () => ({}),
  own: (ids) => [ids.principalId, ids.sub],
  probe: voters,
});
