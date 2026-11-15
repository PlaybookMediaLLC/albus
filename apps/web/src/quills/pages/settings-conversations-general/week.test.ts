import { describe, expect, it } from "vite-plus/test";
import { toIntervals, weekRows } from "./week";

const stored = [
  { day: 1, start: "09:00", end: "12:00" },
  { day: 1, start: "13:00", end: "17:00" },
  { day: 0, start: "10:00", end: "14:00" },
];

describe("week", () => {
  it("makes one row for each day, Monday first, from the first interval of the day", () => {
    const rows = weekRows(stored);
    expect(rows.map((row) => row.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows[0]).toEqual({
      day: 1,
      open: true,
      start: "09:00",
      end: "12:00",
    });
    expect(rows[1]).toEqual({
      day: 2,
      open: false,
      start: "09:00",
      end: "17:00",
    });
  });

  it("keeps the other intervals of an open day and drops a closed day", () => {
    const rows = weekRows(stored).map((row) =>
      row.day === 1
        ? { ...row, start: "08:00" }
        : row.day === 0
          ? { ...row, open: false }
          : row,
    );
    expect(toIntervals(rows, stored)).toEqual([
      { day: 1, start: "08:00", end: "12:00" },
      { day: 1, start: "13:00", end: "17:00" },
    ]);
  });
});
