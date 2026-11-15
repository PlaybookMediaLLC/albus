import Widget = require("@quills/widget");
import ReactAdapter = require("@quills/widget/react");
import Version = require("@quills/widget/version");
import UI = require("@quills/widget/ui");

UI.WidgetView satisfies (props: UI.WidgetViewProps) => unknown;

export function useConsumer() {
  const sdk: typeof Widget.Quills = ReactAdapter.useQuills();
  sdk.init({ instanceUrl: "https://feedback.example.com", workspace: "acme" });
  sdk.open({ view: "messages" });
  Version.SDK_VERSION satisfies string;
  ({}) satisfies Widget.EventMap["close"];
  // @ts-expect-error Close events carry an empty object, not a scalar.
  "invalid" satisfies Widget.EventMap["close"];
  // @ts-expect-error Tracking consent must be boolean.
  sdk.tracking("true");
}
