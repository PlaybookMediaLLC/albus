import { Quills } from "@quills/widget";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HostPage } from "../components/HostPage.tsx";
import { DEFAULT_INIT } from "../components/InitOptions.tsx";
import { ReactWidget } from "../components/ReactWidget.tsx";
import type { TokenVariant } from "../variants.ts";
import { useIdentityToken } from "../use-identity-token.ts";
import { ANONYMOUS } from "../users.ts";
import type { WidgetApi } from "../widget-api.ts";

export const Route = createFileRoute("/")({ component: ReactHost });

const api = Quills as unknown as WidgetApi;

function ReactHost() {
  const [user, setUser] = useState(ANONYMOUS);
  const [variant, setVariant] = useState<TokenVariant>("valid");
  const [init, setInit] = useState(DEFAULT_INIT);
  const { token, error } = useIdentityToken(user, variant);
  return (
    <HostPage
      title="React adapter: useQuillsInit"
      api={api}
      user={user}
      onUser={setUser}
      variant={variant}
      onVariant={setVariant}
      token={token}
      error={error}
      init={init}
      onInit={setInit}
    >
      <ReactWidget key={JSON.stringify(init)} init={init} token={token} />
    </HostPage>
  );
}
