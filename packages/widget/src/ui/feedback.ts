import type { MessageKey } from "./i18n/messages/en.js";
import type { FeedbackStatus } from "./types.js";

/** English labels; the views show them through `t`. */
export const feedbackStatusLabels: Record<FeedbackStatus, MessageKey> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
};
