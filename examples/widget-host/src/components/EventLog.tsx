export type LogEntry = {
  id: number;
  at: string;
  name: string;
  payload: string;
};

/** The live log of widget events and control results, newest first. */
export function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section aria-labelledby="log-title">
      <h2 id="log-title">Event log</h2>
      <ol data-testid="event-log" className="log" aria-live="polite">
        {entries.map((entry) => (
          <li key={entry.id} data-event={entry.name}>
            <time>{entry.at}</time> <strong>{entry.name}</strong>{" "}
            <code>{entry.payload}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}
