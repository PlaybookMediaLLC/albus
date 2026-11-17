import { resolveApiBaseUrl } from "@kaneo/libs";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "../../ui/upstream";
import {
  DESKTOP_CLIENT_ID,
  DEVICE_GRANT,
  runDeviceSignIn,
  type DeviceCode,
  type SignInResult,
} from "./device-flow";

export type DesktopSignInState =
  | { step: "checking" }
  | { step: "idle" }
  | { step: "starting" }
  | { step: "waiting"; code: DeviceCode }
  | { step: "failed"; reason: Exclude<SignInResult, "signed-in" | "cancelled"> }
  | { step: "signed-in" }
  /** Signed in before the page opened, for example after a Google link in the app. */
  | { step: "already"; userId: string };

/** Opens the approval page. The desktop app sends every new window to the system browser. */
export function openApproval(code: DeviceCode) {
  window.open(
    code.verification_uri_complete ?? code.verification_uri,
    "_blank",
    "noopener,noreferrer",
  );
}

async function createDesktopSession(token: string) {
  const api = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
  const response = await fetch(`${api}/desktop/session`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Desktop session: ${response.status}`);
}

/**
 * The desktop sign-in. `onSignedIn` runs after a sign-in on this page; `autoStart` opens the
 * browser at once.
 */
export function useDeviceSignIn(autoStart: boolean, onSignedIn: () => void) {
  const [state, setState] = useState<DesktopSignInState>({ step: "checking" });
  const flow = useRef<AbortController | null>(null);
  const signedIn = useRef(onSignedIn);
  signedIn.current = onSignedIn;

  const start = useCallback(() => {
    flow.current?.abort();
    const controller = new AbortController();
    flow.current = controller;
    setState({ step: "starting" });
    void runDeviceSignIn({
      requestCode: async () => {
        const { data, error } = await authClient.device.code({
          client_id: DESKTOP_CLIENT_ID,
        });
        if (error || !data) throw new Error("No device code");
        return data;
      },
      requestToken: async (deviceCode) => {
        const { data, error } = await authClient.device.token({
          grant_type: DEVICE_GRANT,
          device_code: deviceCode,
          client_id: DESKTOP_CLIENT_ID,
        });
        if (data?.access_token) return { token: data.access_token };
        const code = (error as { error?: unknown } | null)?.error;
        // A 502 or 429 without an OAuth code: ask again at the next interval.
        if (typeof code !== "string") throw new Error("No device token yet");
        return { error: code };
      },
      createSession: createDesktopSession,
      onCode: (code) => {
        if (controller.signal.aborted) return;
        setState({ step: "waiting", code });
        openApproval(code);
      },
      wait: (ms) =>
        new Promise((done) => {
          const timer = setTimeout(done, ms);
          controller.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              done();
            },
            { once: true },
          );
        }),
      now: Date.now,
      signal: controller.signal,
    }).then((result) => {
      if (controller.signal.aborted || result === "cancelled") return;
      if (result === "signed-in") {
        setState({ step: "signed-in" });
        signedIn.current();
      } else setState({ step: "failed", reason: result });
    });
  }, []);

  const cancel = useCallback(() => {
    flow.current?.abort();
    setState({ step: "idle" });
  }, []);

  useEffect(() => {
    let live = true;
    const begin = () => (autoStart ? start() : setState({ step: "idle" }));
    authClient
      .getSession()
      .then(({ data }) => {
        if (!live) return;
        if (data?.user) setState({ step: "already", userId: data.user.id });
        else begin();
      })
      .catch(() => {
        if (live) begin();
      });
    return () => {
      live = false;
      flow.current?.abort();
    };
  }, [autoStart, start]);

  return { state, start, cancel };
}
