type PositionedTask = { id: string; position: number | null; status: string };

/** The tasks whose position or status differs between two orderings. */
export function changedTaskPositions(
  before: ReadonlyArray<PositionedTask>,
  after: ReadonlyArray<PositionedTask>,
) {
  const previous = new Map(before.map((task) => [task.id, task]));
  return after.flatMap((task) => {
    const old = previous.get(task.id);
    const position = task.position ?? 0;
    if (old && old.position === position && old.status === task.status)
      return [];
    return [
      {
        id: task.id,
        position,
        ...(old?.status !== task.status ? { status: task.status } : {}),
      },
    ];
  });
}
