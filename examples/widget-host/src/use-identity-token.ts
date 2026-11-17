import { useEffect, useState } from "react";
import { signIdentity } from "./identity.ts";
import type { TokenVariant } from "./variants.ts";
import { ANONYMOUS } from "./users.ts";

/** The signed identify token for the fake signed-in user; undefined while anonymous. */
export function useIdentityToken(user: string, variant: TokenVariant) {
  const [state, setState] = useState<{ token?: string; error?: string }>({});
  useEffect(() => {
    let current = true;
    if (user === ANONYMOUS) {
      setState({});
      return;
    }
    signIdentity({ data: { user, variant } }).then(
      (token) => current && setState({ token }),
      (error: Error) => current && setState({ error: error.message }),
    );
    return () => {
      current = false;
    };
  }, [user, variant]);
  return state;
}
