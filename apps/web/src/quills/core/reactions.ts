/** The comment reactions that the API accepts, in picker order. */
export const reactionEmoji = [
  "👍",
  "❤️",
  "🎉",
  "😄",
  "😕",
  "👀",
  "🚀",
] as const;

/**
 * The comment vote: the 👍 reaction, as the widget counts it (FEEDBACK_REACTION_EMOJIS in the
 * API). D4 of the Requests parity plan.
 */
export const commentVoteEmoji = "👍";
