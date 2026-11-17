import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { settings } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import {
  portalSignIn,
  readPortalSignIn,
  SIGN_IN_MODES,
} from "../framework/portal-sign-in";
import { parseJson } from "../settings/area";

export { portalSignIn, readPortalSignIn };

// How customers sign in to the portal (gaps G-17 and G-24). Kaneo accounts are the one login
// system; these settings only choose how a customer reaches one:
// - account: the Kaneo sign-in page (the default).
// - sso: the portal's sign-in button opens the host app's login page, which sends the person back
//   with a token signed by the widget secret.
// - disabled: no customer signs in to the portal; it stays readable where access allows.
// widgetSignIn lets the widget open the portal already signed in. Token sign-in reaches only a
// portal-only account that it created for this workspace's customer (auth/quills-portal-session.ts).

const policy = z.object({
  mode: z.enum(SIGN_IN_MODES),
  widgetSignIn: z.boolean(),
  ssoUrl: z.string().nullable(),
});

const updateSignIn = defineQuillsRoute({
  method: "put",
  path: "/settings/portal/sign-in",
  operationId: "updateQuillsPortalSignIn",
  summary: "Update how customers sign in to the portal",
  description:
    "sso needs ssoUrl, the host app's login page: the portal sends the person there with return_to, and the host app redirects back to return_to with a token parameter signed by the widget secret. A token signs in only to a portal-only account that token sign-in created for this workspace's customer; an email that already has an account uses the sign-in page.",
  action: "manage_settings",
  body: z.object({
    mode: z.enum(SIGN_IN_MODES),
    widgetSignIn: z.boolean(),
    ssoUrl: z
      .url({ protocol: /^https?$/ })
      .max(500)
      .nullable(),
  }),
  response: policy,
  responseDescription: "The portal sign-in policy",
  errors: { 400: "sso needs ssoUrl" },
  event: ({ workspaceId }, result) => ({
    type: "settings.portal_sign_in_updated",
    entityType: "settings",
    entityId: workspaceId,
    payload: { mode: result.mode, widgetSignIn: String(result.widgetSignIn) },
  }),
  handler: async ({ db, body }) => {
    if (body.mode === "sso" && !body.ssoUrl)
      throw new HTTPException(400, { message: "sso needs ssoUrl" });
    const [row] = await db
      .select({ id: settings.id, portalConfig: settings.portalConfig })
      .from(settings)
      .limit(1)
      .for("update");
    if (!row) throw new Error("Quills settings were not initialized");
    const config = parseJson(row.portalConfig);
    const signIn = {
      mode: body.mode,
      widgetSignIn: body.widgetSignIn,
      ssoUrl: body.ssoUrl,
    };
    const portalConfig = JSON.stringify({ ...config, signIn });
    await db
      .update(settings)
      .set({ portalConfig })
      .where(eq(settings.id, row.id));
    return readPortalSignIn(portalConfig);
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>().openapi(
  ...updateSignIn,
);
