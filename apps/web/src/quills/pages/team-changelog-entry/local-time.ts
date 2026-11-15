/** An ISO time as the value of an `<input type="datetime-local">` in the browser's time zone. */
export function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

/** The value of an `<input type="datetime-local">` as an ISO time, or null when it is not a time. */
export function fromLocalInput(value: string) {
  const time = Date.parse(value);
  return value && !Number.isNaN(time) ? new Date(time).toISOString() : null;
}
