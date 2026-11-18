import { Ticket } from "lucide-react";
import { describe, expect, it } from "vite-plus/test";
import { eventIcons } from "./event-icons";

describe("eventIcons", () => {
  it("gives every ticket event the ticket icon and leaves unknown events out", () => {
    expect(eventIcons.ticket_created).toBe(Ticket);
    expect(eventIcons.ticket_linked).toBe(Ticket);
    expect(eventIcons.ticket_status_changed).toBe(Ticket);
    expect(eventIcons.unknown_event).toBeUndefined();
  });
});
