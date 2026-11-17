import type { OpenOptions } from "@quills/widget";
import { useState } from "react";
import type { WidgetApi } from "../widget-api.ts";

const VIEWS = [
  "home",
  "new-post",
  "changelog",
  "help",
  "help-category",
  "notifications",
  "chat",
  "messages",
  "tickets",
  "postId",
  "articleId",
] as const;
type View = (typeof VIEWS)[number];

type Props = {
  api: WidgetApi;
  /** Re-sends the signed-in user's identity, or anonymous. */
  identify: () => void;
  /** The signed-in user's identity, or undefined for anonymous. */
  identity: () => { ssoToken: string } | undefined;
  log: (name: string, payload: unknown) => void;
  subscribe: () => void;
  unsubscribe: () => void;
};

function openOptions(view: View, text: string, board: string): OpenOptions {
  switch (view) {
    case "home":
      return { view: "home" };
    case "new-post":
      return {
        view: "new-post",
        title: text || "Bug:",
        body: "Opened from the widget host.",
        ...(board && { board }),
      };
    case "changelog":
      return text
        ? { view: "changelog", entryId: text }
        : { view: "changelog" };
    case "help":
      return text ? { view: "help", query: text } : { view: "help" };
    case "help-category":
      return { view: "help", category: text || "Getting started" };
    case "messages":
      return text ? { view: "messages", body: text } : { view: "messages" };
    case "postId":
      return { postId: text };
    case "articleId":
      return { articleId: text };
    default:
      return { view };
  }
}

/** One control per public SDK method. */
export function SdkControls({
  api,
  identify,
  identity,
  log,
  subscribe,
  unsubscribe,
}: Props) {
  const [view, setView] = useState<View>("home");
  const [text, setText] = useState("");
  const [board, setBoard] = useState("");
  const [metaKey, setMetaKey] = useState("plan");
  const [metaValue, setMetaValue] = useState("pro");
  const run = (name: string, action: () => void) => () => {
    action();
    log(`call ${name}`, "called");
  };
  // State queries log the raw answer, so an embed path that cannot answer shows undefined.
  const ask = (name: string, query: () => unknown) => () =>
    log(`call ${name}`, query() ?? "undefined");
  return (
    <fieldset className="controls">
      <legend>SDK methods</legend>
      <div>
        <button type="button" onClick={run("identify", identify)}>
          identify
        </button>
        <button type="button" onClick={run("identify()", () => api.identify())}>
          identify() anonymous
        </button>
        <button type="button" onClick={run("logout", () => api.logout())}>
          logout
        </button>
      </div>
      <div>
        <label>
          view{" "}
          <select
            data-testid="open-view"
            value={view}
            onChange={(event) => setView(event.target.value as View)}
          >
            {VIEWS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>{" "}
        <label>
          title / query / id{" "}
          <input
            data-testid="open-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>{" "}
        <label>
          board{" "}
          <input
            data-testid="open-board"
            value={board}
            onChange={(event) => setBoard(event.target.value)}
          />
        </label>{" "}
        <button
          type="button"
          onClick={run("open", () => api.open(openOptions(view, text, board)))}
        >
          open
        </button>
        <button type="button" onClick={run("close", () => api.close())}>
          close
        </button>
        <button type="button" onClick={run("toggle", () => api.toggle())}>
          toggle
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={run("showLauncher", () => api.showLauncher())}
        >
          showLauncher
        </button>
        <button
          type="button"
          onClick={run("hideLauncher", () => api.hideLauncher())}
        >
          hideLauncher
        </button>
        <button
          type="button"
          onClick={run("tracking(true)", () => api.tracking(true))}
        >
          tracking(true)
        </button>
        <button
          type="button"
          onClick={run("tracking(false)", () => api.tracking(false))}
        >
          tracking(false)
        </button>
      </div>
      <div>
        <label>
          metadata key{" "}
          <input
            data-testid="meta-key"
            value={metaKey}
            onChange={(event) => setMetaKey(event.target.value)}
          />
        </label>{" "}
        <label>
          value{" "}
          <input
            data-testid="meta-value"
            value={metaValue}
            onChange={(event) => setMetaValue(event.target.value)}
          />
        </label>{" "}
        <button
          type="button"
          onClick={run("metadata", () =>
            api.metadata({ [metaKey]: metaValue }),
          )}
        >
          metadata set
        </button>
        <button
          type="button"
          onClick={run("metadata null", () =>
            api.metadata({ [metaKey]: null }),
          )}
        >
          metadata remove
        </button>
      </div>
      <div>
        <button type="button" onClick={subscribe}>
          on (all events)
        </button>
        <button type="button" onClick={unsubscribe}>
          off (all events)
        </button>
        <button type="button" onClick={run("destroy", () => api.destroy())}>
          destroy
        </button>
      </div>
      <div>
        <button type="button" onClick={ask("isOpen", () => api.isOpen())}>
          isOpen
        </button>
        <button type="button" onClick={ask("getUser", () => api.getUser())}>
          getUser
        </button>
        <button
          type="button"
          onClick={ask("isIdentified", () => api.isIdentified())}
        >
          isIdentified
        </button>
        <button type="button" onClick={ask("getState", () => api.getState())}>
          getState
        </button>
      </div>
      <div>
        {(["auto", "light", "dark"] as const).map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={run(`setTheme(${theme})`, () => api.setTheme(theme))}
          >
            setTheme({theme})
          </button>
        ))}
        <button
          type="button"
          onClick={run("setLocale(fr)", () => api.setLocale("fr"))}
        >
          setLocale(fr)
        </button>
        <button
          type="button"
          onClick={run("identify() result", () => {
            const result = api.identify(identity());
            if (result instanceof Promise)
              void result.then((value) => log("identify() resolved", value));
          })}
        >
          identify() and await
        </button>
      </div>
    </fieldset>
  );
}
