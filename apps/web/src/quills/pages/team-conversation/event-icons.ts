import {
  AlarmClock,
  CircleCheck,
  Flag,
  type LucideIcon,
  RotateCcw,
  Star,
  Ticket,
  UserRound,
} from "lucide-react";

/** The icon of each conversation event that the thread shows as a centered line. */
export const eventIcons: Record<string, LucideIcon> = {
  chat_ended: CircleCheck,
  chat_reopened: RotateCcw,
  assigned: UserRound,
  snoozed: AlarmClock,
  priority_changed: Flag,
  ticket_created: Ticket,
  ticket_linked: Ticket,
  ticket_status_changed: Ticket,
  csat_submitted: Star,
};
