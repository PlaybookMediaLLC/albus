import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HostPage } from "../components/HostPage.tsx";
import { DEFAULT_INIT, initFields } from "../components/InitOptions.tsx";
import { SDK_URL } from "../config.ts";
import type { TokenVariant } from "../variants.ts";
import { useIdentityToken } from "../use-identity-token.ts";
import { ANONYMOUS } from "../users.ts";
import { installScriptStub, scriptApi } from "../widget-api.ts";

export const Route = createFileRoute("/script")({ component: ScriptHost });

/** The script-tag embed: the customer snippet's stub, then sdk.js from the Kaneo API. */
function ScriptHost() {
  // Before the children's effects subscribe to events through the stub.
  if (typeof window !== "undefined") installScriptStub();
  const [user, setUser] = useState(ANONYMOUS);
  const [variant, setVariant] = useState<TokenVariant>("valid");
  const [init, setInit] = useState(DEFAULT_INIT);
  const { token, error } = useIdentityToken(user, variant);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (document.querySelector(`script[src="${SDK_URL}"]`)) return;
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.defer = true;
    document.head.append(script);
  }, []);
  // sdk.js reads the instance URL and the workspace from its own URL.
  useEffect(() => {
    const current = tokenRef.current;
    window.Quills?.("init", {
      ...initFields(init),
      ...(current && { identity: { ssoToken: current } }),
    });
  }, [init]);
  useEffect(() => {
    window.Quills?.("identify", token ? { ssoToken: token } : undefined);
  }, [token]);

  return (
    <HostPage
      title="Script tag: sdk.js"
      api={scriptApi}
      user={user}
      onUser={setUser}
      variant={variant}
      onVariant={setVariant}
      token={token}
      error={error}
      init={init}
      onInit={setInit}
    >
      <p className="hint">
        Script tag: <code>{SDK_URL}</code>
      </p>
    </HostPage>
  );
}
