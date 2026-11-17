import { isSmtpConfigured } from "@kaneo/email";
import { HTTPException } from "hono/http-exception";
import { resolveFileSecret } from "../../utils/file-secret";
import { portalPaths } from "../portal/paths";

// The only Quills module that asks Kaneo to mail a sign-in link (issue #129, option C). Kaneo's
// magic link is the existing sign-in: it works once, expires after 5 minutes and, when opened,
// signs in (or registers, by Kaneo's registration rules) the account of that address with its
// email verified. Quills never mints a session or a token of its own.

/**
 * Kaneo can mail a sign-in link: mail delivery is on, and neither a disabled login form nor a
 * captcha (which a server call cannot pass) refuses its magic link. Kaneo's registration rules may
 * still drop the mail for an address with no account, without saying so.
 */
export const signInLinkAvailable = () =>
  isSmtpConfigured() &&
  process.env.DISABLE_LOGIN_FORM !== "true" &&
  !resolveFileSecret("TURNSTILE_SECRET_KEY");

/**
 * Whether Kaneo mails its sign-in link to any address ("sent") or, with registration closed, only
 * to an address that has an account ("if_account"). It comes from the instance's settings, never
 * from the address, so the answer reveals no account.
 */
export async function signInDelivery(): Promise<"sent" | "if_account"> {
  // Loaded on use, like the auth module below.
  const { getInstanceSettings } =
    await import("../../instance-settings/get-instance-settings");
  const settings = await getInstanceSettings();
  return settings.registrationEnabled && settings.passwordRegistrationEnabled
    ? "sent"
    : "if_account";
}

/**
 * Mails Kaneo's sign-in link for `email`. It opens the workspace portal's My feedback page signed
 * in; a used or expired link opens Kaneo's sign-in page with the error, then the same page.
 */
export async function sendSignInLink(email: string, workspaceId: string) {
  if (!signInLinkAvailable())
    throw new HTTPException(403, {
      message: "This instance cannot send sign-in links",
    });
  // Loaded on use: the auth module needs the server configuration, which most Quills tests do not load.
  const [{ auth }, { APIError }] = await Promise.all([
    import("../../auth"),
    import("better-auth/api"),
  ]);
  try {
    await auth.api.signInMagicLink({
      body: {
        email,
        callbackURL: portalPaths.myFeedback(workspaceId),
        errorCallbackURL: portalPaths.signIn(workspaceId),
      },
      headers: new Headers(),
    });
  } catch (error) {
    // A captcha, a disabled local sign-in or a disposable address: Kaneo refuses the link.
    if (
      error instanceof APIError &&
      typeof error.statusCode === "number" &&
      error.statusCode < 500
    )
      throw new HTTPException(403, {
        message: "A sign-in link cannot be sent now",
      });
    throw error;
  }
}
