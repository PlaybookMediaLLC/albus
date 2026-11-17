import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INSTANCE_URL } from "../config.ts";
import { signIdentity } from "../identity.ts";
import { USERS } from "../users.ts";

export const Route = createFileRoute("/sso")({ component: SsoLogin });

// The host app's login page for the portal's SSO sign-in (gap G-24). The portal sends people here
// with return_to; after they sign in, the server signs their token with the widget secret and
// this page sends them back with it. Only the Kaneo instance's signed sign-in step is a valid
// return_to, so the page is not an open redirect.
const RETURN_PREFIX = `${INSTANCE_URL}/api/quills-public/signed/portal-sign-in?`;

function SsoLogin() {
  const [error, setError] = useState("");
  const returnTo =
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("return_to") ?? "");
  const valid = returnTo.startsWith(RETURN_PREFIX);
  const signIn = async (user: string) => {
    try {
      const token = await signIdentity({ data: { user, variant: "valid" } });
      window.location.assign(`${returnTo}&${new URLSearchParams({ token })}`);
    } catch (failure) {
      setError((failure as Error).message);
    }
  };
  return (
    <main>
      <h1>Sign in to the host app</h1>
      {valid ? (
        <>
          <p className="hint">
            The feedback portal asked who you are. Pick a pretend user.
          </p>
          {USERS.map((user) => (
            <p key={user.key}>
              <button type="button" onClick={() => void signIn(user.key)}>
                Continue as {user.name}
              </button>
            </p>
          ))}
        </>
      ) : (
        <p role="alert">This page needs a return_to from the Kaneo portal.</p>
      )}
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
