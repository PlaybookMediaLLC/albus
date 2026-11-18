import type { ProjectWithTasks } from "@/types/project";

export type BoardPage<T extends ProjectWithTasks> = {
  data: T;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    relatedTotalPages?: number;
  };
};

// Pages in flight at once: hides round-trip latency without flooding the API.
const BOARD_PAGE_CONCURRENCY = 4;

/** Publish immutable snapshots as bounded pages arrive. */
export async function loadBoardPages<T extends ProjectWithTasks>(
  load: (page: number, relatedPage?: number) => Promise<BoardPage<T>>,
  signal?: AbortSignal,
  onProgress?: (board: T) => void,
): Promise<T> {
  signal?.throwIfAborted();
  const first = await load(1);
  const result = first.data;
  const columns = new Map(result.columns.map((column) => [column.id, column]));
  const seen = new Map(
    [
      ...result.columns.flatMap((column) => column.tasks),
      ...result.archivedTasks,
      ...result.plannedTasks,
    ].map((task) => [task.id, task]),
  );
  let progressWeight =
    result.columns.length +
    seen.size +
    [...seen.values()].reduce(
      (count, task) =>
        count + (task.labels?.length ?? 0) + (task.externalLinks?.length ?? 0),
      0,
    );
  let nextProgressWeight = 0;
  const reportProgress = (force = false) => {
    signal?.throwIfAborted();
    if (!onProgress || (!force && progressWeight < nextProgressWeight)) return;
    result.columns.sort(
      (left, right) => (left.position ?? 0) - (right.position ?? 0),
    );
    onProgress(structuredClone(result));
    nextProgressWeight = Math.max(1, progressWeight * 2);
  };
  reportProgress(true);
  const relationIndexes = new WeakMap<object[], Map<string, number>>();
  const mergeById = <U extends { id: string }>(
    left: U[] = [],
    right: U[] = [],
  ) => {
    let indexes = relationIndexes.get(left);
    if (!indexes) {
      indexes = new Map(left.map((value, index) => [value.id, index]));
      relationIndexes.set(left, indexes);
    }
    for (const value of right) {
      const index = indexes.get(value.id);
      if (index === undefined) {
        indexes.set(value.id, left.length);
        left.push(value);
        progressWeight++;
      } else left[index] = value;
    }
    return left;
  };
  const append = (
    target: ProjectWithTasks["plannedTasks"],
    tasks: ProjectWithTasks["plannedTasks"],
  ) => {
    for (const task of tasks) {
      if (!seen.has(task.id)) {
        seen.set(task.id, task);
        target.push(task);
        progressWeight +=
          1 + (task.labels?.length ?? 0) + (task.externalLinks?.length ?? 0);
      } else {
        const existing = seen.get(task.id);
        if (existing) {
          existing.labels = mergeById(existing.labels, task.labels);
          existing.externalLinks = mergeById(
            existing.externalLinks,
            task.externalLinks,
          );
        }
      }
    }
  };
  const merge = (next: BoardPage<T>) => {
    for (const column of next.data.columns) {
      let target = columns.get(column.id);
      if (!target) {
        target = { ...column, tasks: [] };
        columns.set(column.id, target);
        result.columns.push(target);
        progressWeight++;
      }
      append(target.tasks, column.tasks);
    }
    append(result.archivedTasks, next.data.archivedTasks);
    append(result.plannedTasks, next.data.plannedTasks);
  };
  const loadRelated = async (page: number, initial: BoardPage<T>) => {
    // Each collection uses its initial count; live additions cannot indefinitely
    // extend a refresh. The next refresh sees changes made during pagination.
    const total = initial.pagination.relatedTotalPages ?? 1;
    for (let relatedPage = 2; relatedPage <= total; relatedPage++) {
      signal?.throwIfAborted();
      merge(await load(page, relatedPage));
      reportProgress();
    }
  };
  await loadRelated(1, first);
  // Overlap the remaining page requests but merge them in page order, so cards
  // keep the server's order and progress reports stay in sequence.
  const loadPage = async (page: number) => {
    const next = await load(page);
    const related = [next];
    const total = next.pagination.relatedTotalPages ?? 1;
    for (let relatedPage = 2; relatedPage <= total; relatedPage++) {
      signal?.throwIfAborted();
      related.push(await load(page, relatedPage));
    }
    return related;
  };
  const pending: Promise<BoardPage<T>[]>[] = [];
  let nextPage = 2;
  const startNext = () => {
    if (nextPage > first.pagination.totalPages || signal?.aborted) return;
    const request = loadPage(nextPage++);
    // A later page can fail while an earlier one is awaited; it is rethrown when reached.
    request.catch(() => undefined);
    pending.push(request);
  };
  for (let slot = 0; slot < BOARD_PAGE_CONCURRENCY; slot++) startNext();
  for (let index = 0; index < pending.length; index++) {
    const responses = await pending[index];
    signal?.throwIfAborted();
    startNext();
    for (const response of responses) {
      merge(response);
      reportProgress();
    }
  }
  result.columns.sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );
  signal?.throwIfAborted();
  reportProgress(true);
  return result;
}
