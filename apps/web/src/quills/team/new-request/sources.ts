/** Where a teammate heard a customer's request (#73), as the API takes it. */
export const sources = ["call", "meeting", "email", "chat", "other"] as const;
export type Source = (typeof sources)[number];

/** The label of a stored vote source, including the ones a route records itself. */
export const sourceKeys: Record<string, string> = {
  call: "team-posts.sourceCall",
  meeting: "team-posts.sourceMeeting",
  email: "team-posts.sourceEmail",
  chat: "team-posts.sourceChat",
  other: "team-posts.sourceOther",
  conversation: "team-posts.sourceConversation",
  live_chat: "team-posts.sourceConversation",
  ticket: "team-posts.sourceTicket",
  app: "team-posts.sourceApp",
};
