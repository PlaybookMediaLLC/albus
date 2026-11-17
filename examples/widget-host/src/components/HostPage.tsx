import type { ReactNode } from "react";
import type { TokenVariant } from "../variants.ts";
import type { WidgetApi } from "../widget-api.ts";
import { useEventLog } from "../use-event-log.ts";
import { EventLog } from "./EventLog.tsx";
import { InitOptions, type HostInit } from "./InitOptions.tsx";
import { SdkControls } from "./SdkControls.tsx";
import { SignIn } from "./SignIn.tsx";

type Props = {
  title: string;
  api: WidgetApi;
  user: string;
  onUser: (user: string) => void;
  variant: TokenVariant;
  onVariant: (variant: TokenVariant) => void;
  token?: string;
  error?: string;
  init: HostInit;
  onInit: (init: HostInit) => void;
  children?: ReactNode;
};

/** The shared page of both embed paths. */
export function HostPage(props: Props) {
  const { api, token } = props;
  const { entries, log, subscribe, unsubscribe } = useEventLog(api);
  return (
    <main>
      <nav>
        {/* Full page loads: the npm SDK and sdk.js must not share one page. */}
        <a href="/">React adapter</a> · <a href="/script">Script tag</a>
      </nav>
      <h1>{props.title}</h1>
      <p className="hint">
        A pretend customer app. Its server signs the identify token; the browser
        never sees the widget secret.
      </p>
      <SignIn
        user={props.user}
        onUser={props.onUser}
        variant={props.variant}
        onVariant={props.onVariant}
        error={props.error}
      />
      <InitOptions value={props.init} onChange={props.onInit} />
      <SdkControls
        api={api}
        identify={() =>
          void api.identify(token ? { ssoToken: token } : undefined)
        }
        identity={() => (token ? { ssoToken: token } : undefined)}
        log={log}
        subscribe={subscribe}
        unsubscribe={unsubscribe}
      />
      {props.children}
      <p>
        {/* The target of `launcher: { selector }`; the SDK sets data-quills-unread on it. */}
        <button type="button" id="host-launcher" data-testid="host-launcher">
          Help (host launcher)
        </button>
      </p>
      <form
        className="private-demo"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          Password (never in screenshots){" "}
          <input type="password" defaultValue="hunter2" autoComplete="off" />
        </label>{" "}
        <label>
          API key (data-private){" "}
          <input data-private defaultValue="sk_live_demo" />
        </label>{" "}
        <label>
          Email <input type="email" defaultValue="billing@host.test" />
        </label>{" "}
        <label>
          Phone <input type="tel" defaultValue="+1 555 0100" />
        </label>
      </form>
      <EventLog entries={entries} />
    </main>
  );
}
