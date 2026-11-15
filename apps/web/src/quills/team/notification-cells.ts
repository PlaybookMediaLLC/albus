import type { GetNotificationPreferencesResponse } from "../api/team/get-notification-preferences";

/** The notification types that Quills sends today (apps/api/src/quills/jobs/fanout.ts). */
export type NotificationType = "post_status_changed" | "comment_created";
export type Channel = "inApp" | "email";

/** The stored preferences, or the stored preferences with a change that is being saved. */
export interface ShownPreferences {
  emailStatusChange: boolean;
  emailNewComment: boolean;
  matrix: { type: string; inApp?: boolean | null; email?: boolean | null }[];
}

const legacy = {
  post_status_changed: "emailStatusChange",
  comment_created: "emailNewComment",
} as const;

/**
 * The value that the API applies (`wants` in apps/api/src/quills/jobs/preferences.ts): the matrix
 * cell, else the legacy mail flag for email, else on. Mute is a separate switch.
 */
export const effective = (
  prefs: ShownPreferences,
  type: NotificationType,
  channel: Channel,
) =>
  prefs.matrix.find((cell) => cell.type === type)?.[channel] ??
  (channel === "email" ? prefs[legacy[type]] : true);

/** The full matrix with one cell changed. The API replaces the stored matrix, so keep every other cell. */
export function withCell(
  matrix: GetNotificationPreferencesResponse["matrix"],
  type: NotificationType,
  channel: Channel,
  value: boolean,
) {
  const cells = matrix.some((cell) => cell.type === type)
    ? matrix
    : [...matrix, { type, inApp: null, email: null, push: null }];
  return cells.map((cell) => {
    const next = cell.type === type ? { ...cell, [channel]: value } : cell;
    // The API takes a boolean or no value, not null.
    return {
      type: next.type,
      inApp: next.inApp ?? undefined,
      email: next.email ?? undefined,
      push: next.push ?? undefined,
    };
  });
}
