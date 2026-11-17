import { settings } from "../../database/quills/schema/auth";
import { fixture, type ContractEnv } from "../framework/contract";
import { mintGrant } from "../framework/portal-sign-in";

// Portal token sign-in (gaps G-17 and G-24): the widget's link route and the signed first step.

/** The portal on with widget sign-in, and an identified widget visitor, in one workspace. */
async function side(env: ContractEnv, workspaceId: string) {
  const visitor = await env.widgetVisitor(workspaceId);
  const secret = await env.scoped(workspaceId, async (db) => {
    await db.update(settings).set({
      portalConfig: JSON.stringify({
        enabled: true,
        signIn: { mode: "account", widgetSignIn: true, ssoUrl: null },
      }),
    });
    const [row] = await db
      .select({ secret: settings.widgetSecret })
      .from(settings);
    return row!.secret!;
  });
  return { ...visitor, secret, workspaceId };
}
const seed = async (env: ContractEnv) => ({
  a: await side(env, env.a),
  b: await side(env, env.b),
});
type Sides = Awaited<ReturnType<typeof seed>>;
const code = (
  side: { workspaceId: string; customerId: string },
  ttlMs?: number,
) =>
  mintGrant(
    "handoff",
    { workspaceId: side.workspaceId, customerId: side.customerId, next: "" },
    ttlMs,
  );
const request = (side: Sides["a"], value = code(side)) => ({
  query: { workspace: side.workspaceId, code: value },
});

export const createQuillsWidgetPortalSignIn = fixture({
  seed,
  valid: ({ a }: Sides) => ({ bearer: a.token, body: { next: "/boards" } }),
  own: () => [],
});

export const startQuillsPortalTokenSignIn = fixture({
  seed,
  valid: ({ a }: Sides) => request(a),
  hidden: ({ a, b }: Sides) => [a.secret, b.secret],
  forged: ({ a, b }: Sides) => {
    const good = code(a);
    const [payload, signature] = good.split(".");
    return [
      // A changed claim: the signature no longer matches.
      request(
        a,
        `${Buffer.from(
          Buffer.from(payload!, "base64url")
            .toString()
            .replace(a.customerId, b.customerId),
        ).toString("base64url")}.${signature}`,
      ),
      request(a, code(a, -1000)),
      // A's code under B's name.
      { query: { workspace: b.workspaceId, code: good } },
      // An SSO token that A's widget secret did not sign.
      { query: { workspace: a.workspaceId, token: "a.b.c" } },
    ];
  },
  crossed: ({ b }: Sides) => [request(b)],
});
