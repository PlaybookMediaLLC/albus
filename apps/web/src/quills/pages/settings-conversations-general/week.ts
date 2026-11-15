export interface Interval {
  /** 0 is Sunday, as the API counts. */
  day: number;
  start: string;
  end: string;
}

export interface DayRow {
  day: number;
  open: boolean;
  start: string;
  end: string;
}

/** Monday first. */
export const weekDays = [1, 2, 3, 4, 5, 6, 0] as const;

/** One editable row for each day, from the first interval of that day. */
export function weekRows(intervals: readonly Interval[]): DayRow[] {
  return weekDays.map((day) => {
    const first = intervals.find((interval) => interval.day === day);
    return first
      ? { day, open: true, start: first.start, end: first.end }
      : { day, open: false, start: "09:00", end: "17:00" };
  });
}

/**
 * The intervals for the API from the edited rows. The form edits the first interval of a day,
 * so the other intervals of an open day stay as stored. A closed day has none.
 */
export function toIntervals(
  rows: readonly DayRow[],
  stored: readonly Interval[],
): Interval[] {
  return rows.flatMap(({ day, open, start, end }) =>
    open
      ? [
          { day, start, end },
          ...stored.filter((interval) => interval.day === day).slice(1),
        ]
      : [],
  );
}
