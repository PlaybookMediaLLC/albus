// Browser sign-in for the desktop app: the OAuth device flow (RFC 8628). The person signs in
// and approves in the system browser. This page waits for the token, then asks the API to set
// the session cookie in the app's web view.

export const DESKTOP_CLIENT_ID = "kaneo-cli";
export const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";

export interface DeviceCode {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

/** The token, or the OAuth error code of a pending, slowed, denied or expired request. */
export type TokenReply = { token: string } | { error: string };

export type SignInResult =
  | "signed-in"
  | "denied"
  | "expired"
  | "failed"
  | "cancelled";

export interface DeviceSignIn {
  requestCode(): Promise<DeviceCode>;
  requestToken(deviceCode: string): Promise<TokenReply>;
  createSession(token: string): Promise<void>;
  /** Shows the code and opens the approval page. */
  onCode(code: DeviceCode): void;
  /** Resolves after `ms`, or at once when the flow is cancelled. */
  wait(ms: number): Promise<void>;
  now(): number;
  signal: AbortSignal;
}

export async function runDeviceSignIn(
  flow: DeviceSignIn,
): Promise<SignInResult> {
  let code: DeviceCode;
  try {
    code = await flow.requestCode();
  } catch {
    return "failed";
  }
  if (flow.signal.aborted) return "cancelled";
  flow.onCode(code);
  const deadline = flow.now() + code.expires_in * 1000;
  let interval = Math.max(code.interval, 1) * 1000;
  while (!flow.signal.aborted) {
    await flow.wait(interval);
    if (flow.signal.aborted) break;
    if (flow.now() >= deadline) return "expired";
    let reply: TokenReply;
    try {
      reply = await flow.requestToken(code.device_code);
    } catch {
      // A network error: ask again at the next interval, until the code expires.
      continue;
    }
    // A cancel during the request: do not sign in after all.
    if (flow.signal.aborted) break;
    if ("token" in reply) {
      try {
        await flow.createSession(reply.token);
        return "signed-in";
      } catch {
        return "failed";
      }
    }
    if (reply.error === "authorization_pending") continue;
    if (reply.error === "slow_down") {
      interval += 5000;
      continue;
    }
    if (reply.error === "access_denied") return "denied";
    if (reply.error === "expired_token") return "expired";
    return "failed";
  }
  return "cancelled";
}
