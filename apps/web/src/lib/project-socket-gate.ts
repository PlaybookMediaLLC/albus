// A first board load waits briefly for its project socket, so every page is
// read after the socket subscribed and the connect-time reconcile, a second
// full board load, can be skipped.
const connecting = new Set<string>();
const waiting = new Map<string, Set<() => void>>();

function release(projectId: string) {
  const resolvers = [...(waiting.get(projectId) ?? [])];
  waiting.delete(projectId);
  for (const resolve of resolvers) resolve();
  return resolvers.length > 0;
}

export function projectSocketConnecting(projectId: string) {
  connecting.add(projectId);
}

/** The socket subscribed; true when a board load was waiting and reads after it. */
export function projectSocketOpened(projectId: string) {
  connecting.delete(projectId);
  return release(projectId);
}

/** The socket closed or was disposed; waiting loads proceed without it. */
export function projectSocketStopped(projectId: string) {
  connecting.delete(projectId);
  release(projectId);
}

export async function waitForProjectSocket(
  projectId: string,
  signal?: AbortSignal,
  timeoutMs = 1500,
) {
  // The view starts its query in an effect that runs before the project
  // route's socket effect in the same commit; let that one start connecting.
  await Promise.resolve();
  if (!connecting.has(projectId)) return;
  return new Promise<void>((resolve) => {
    const resolvers = waiting.get(projectId) ?? new Set<() => void>();
    waiting.set(projectId, resolvers);
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolvers.delete(done);
      resolve();
    };
    // A slow socket must not hold the board; the connect reconcile then covers the gap.
    const timer = setTimeout(done, timeoutMs);
    signal?.addEventListener("abort", done, { once: true });
    resolvers.add(done);
  });
}
