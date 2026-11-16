import { expect, it } from "vite-plus/test";
import { calendarDate } from "./calendar-date";

it("formats a calendar date without shifting the day", () => {
  expect(calendarDate("2026-10-12", "en-US")).toBe("Oct 12");
  expect(calendarDate("2026-01-01", "en-US", true)).toBe("Jan 1, 2026");
  expect(calendarDate("2026-10-12", "de-DE")).toBe("12. Okt.");
});
