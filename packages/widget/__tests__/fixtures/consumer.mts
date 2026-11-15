import Quills, { type EventMap, type WidgetUser } from "@quills/widget";
import { useQuills, useQuillsInit, useQuillsEvent } from "@quills/widget/react";
import { SDK_VERSION } from "@quills/widget/version";
import { WidgetView, type WidgetViewProps } from "@quills/widget/ui";

const viewProps: WidgetViewProps = { onClose: () => {}, initialTab: "home" };
const recordReturningAction: WidgetViewProps["onSubmitFeedback"] =
  async () => ({ id: "saved" });
void recordReturningAction;
const legacyOneArgumentAction: WidgetViewProps["onSendMessage"] = async (
  body: string,
) => ({ body });
const replyAction: WidgetViewProps["onReplyMessage"] = async (
  conversationId,
  body,
  options,
) => {
  options.idempotencyKey satisfies string;
  return { conversationId, body };
};
const voteAction: WidgetViewProps["onVoteFeedback"] = async (
  _postId,
  voted,
) => {
  voted satisfies boolean;
};
void legacyOneArgumentAction;
void replyAction;
void voteAction;
({
  id: "p",
  title: "Idea",
  body: "",
  author: "Ada",
  votes: 1,
  // @ts-expect-error A status must use the documented vocabulary.
  status: "done",
}) satisfies NonNullable<WidgetViewProps["feedback"]>[number];
WidgetView satisfies (props: WidgetViewProps) => unknown;
void viewProps;
// @ts-expect-error A close handler is required for an accessible panel.
({ initialTab: "home" }) satisfies WidgetViewProps;

export function useConsumer() {
  const sdk: typeof Quills = useQuills();
  sdk.init({
    instanceUrl: "https://feedback.example.com",
    workspace: "acme",
    identity: { id: "a", email: "a@example.com" },
  });
  useQuillsInit({
    instanceUrl: "https://feedback.example.com",
    workspace: "acme",
    shouldInitialize: false,
  });
  useQuillsEvent("vote", (payload: EventMap["vote"]) => {
    payload.voted satisfies boolean;
  });
  const user: WidgetUser | null = sdk.getUser();
  SDK_VERSION satisfies string;
  user?.id satisfies string | undefined;
  sdk.open({ articleId: "article_saved" });
  ({}) satisfies EventMap["ready"];
  // @ts-expect-error Ready events carry an empty object, not a scalar.
  42 satisfies EventMap["ready"];
  // @ts-expect-error Unread is a number, not a string.
  sdk.on("unread", (payload: { count: string }) => {
    void payload;
  });
  // @ts-expect-error Unknown views are not part of the public API.
  sdk.open({ view: "unknown" });
}
