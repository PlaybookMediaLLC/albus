import { ApiError, type Api } from "./api.js";
import {
  mergeMessages,
  toArticle,
  toComment,
  toConversation,
  toMessage,
  toPost,
  toUpdate,
  type ApiArticle,
  type ApiChangelogEntry,
  type ApiComment,
  type ApiConversation,
  type ApiMessage,
  type ApiPost,
} from "./map.js";
import type {
  Conversation,
  FeedbackField,
  FeedbackPost,
  HelpArticle,
  UpdateEntry,
} from "../ui/types.js";

/** The widget tabs that the workspace turned on (config.json `tabs`). */
export interface Surfaces {
  feedback: boolean;
  changelog: boolean;
  help: boolean;
  messenger: boolean;
}
export interface Snapshot {
  feedback: FeedbackPost[];
  updates: UpdateEntry[];
  articles: HelpArticle[];
  conversations: Conversation[];
  /** The surfaces that loaded for this visitor; the view gets actions only for these. */
  available: Surfaces;
}
const none: Surfaces = {
  feedback: false,
  changelog: false,
  help: false,
  messenger: false,
};
export const emptySnapshot: Snapshot = {
  feedback: [],
  updates: [],
  articles: [],
  conversations: [],
  available: none,
};
type Thread = { conversation: ApiConversation; messages: ApiMessage[] };

// ponytail: one page per list (50 posts and updates, 100 articles, 20 conversations with
// their latest 30 messages, 100 comments). The view has no "load more" control yet.
const LIMITS = {
  posts: 50,
  updates: 50,
  articles: 100,
  conversations: 20,
  roadmap: 20,
};
const ROADMAP_STAGES = ["in_progress", "planned", "shipped"] as const;

const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined) params.set(key, String(value));
  return `?${params}`;
};

/**
 * A surface that is off for this visitor: 404 when its module switch is off, 403 when a
 * private portal admits only identified visitors (portal/feedback/ROUTES.md).
 */
export const unavailable = (error: unknown) =>
  error instanceof ApiError && (error.status === 403 || error.status === 404);

/** Null when the surface is off, so it is hidden instead of failing the whole load. */
async function surface<T>(enabled: boolean, load: () => Promise<T[]>) {
  if (!enabled) return null;
  try {
    return await load();
  } catch (error) {
    if (unavailable(error)) return null;
    throw error;
  }
}

/** A board that the visitor sees, with its public custom fields (issue #71). */
export interface WidgetBoard {
  id: string;
  slug: string;
  name: string;
  canSubmit: boolean;
  fields: FeedbackField[];
}

/** The boards that the visitor sees, by name. */
export async function loadBoards(api: Api, signal?: AbortSignal) {
  const { items } = await api.request<{ items: WidgetBoard[] }>(
    "GET",
    "/widget/boards",
    undefined,
    signal,
  );
  return items.map((board) => ({ ...board, fields: board.fields ?? [] }));
}

/** The ID of the init `defaultBoard` (an ID or slug) when the visitor can see it. */
export async function resolveBoard(
  api: Api,
  ref: string,
  signal?: AbortSignal,
) {
  const items = await loadBoards(api, signal);
  return items.find((board) => board.id === ref || board.slug === ref)?.id;
}

export async function loadConversations(api: Api, signal?: AbortSignal) {
  const { items } = await api.request<{ items: ApiConversation[] }>(
    "GET",
    `/widget/conversations${query({ limit: LIMITS.conversations })}`,
    undefined,
    signal,
  );
  const threads = await Promise.all(
    items.map((item) =>
      api.request<Thread>(
        "GET",
        `/widget/conversations/${encodeURIComponent(item.id)}`,
        undefined,
        signal,
      ),
    ),
  );
  // The API lists newest activity first; the view reads oldest first.
  return threads
    .map((thread) => toConversation(thread.conversation, thread.messages))
    .reverse();
}

export async function loadSnapshot(
  api: Api,
  options: { surfaces: Surfaces; locale?: string; boardId?: string },
  signal?: AbortSignal,
): Promise<Snapshot> {
  const { surfaces, locale, boardId } = options;
  const [feedback, updates, articles, conversations] = await Promise.all([
    surface(surfaces.feedback, async () => {
      const list = (path: string) =>
        api.request<{ items: ApiPost[] }>("GET", path, undefined, signal);
      // The Roadmap reads each stage on its own, so it is not limited to the newest posts. A failed
      // stage read only shortens the Roadmap.
      const [main, ...stages] = await Promise.all([
        list(`/widget/posts${query({ limit: LIMITS.posts, boardId })}`),
        ...ROADMAP_STAGES.map((stage) =>
          list(
            `/widget/posts${query({ limit: LIMITS.roadmap, boardId, stage, sort: "votes" })}`,
          ).catch(() => ({ items: [] as ApiPost[] })),
        ),
      ]);
      const seen = new Set<string>();
      return [main, ...stages]
        .flatMap(({ items }) => items)
        .filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)))
        .flatMap((item) => toPost(item) ?? []);
    }),
    surface(surfaces.changelog, async () => {
      const { entries } = await api.request<{ entries: ApiChangelogEntry[] }>(
        "GET",
        // Entries that a teammate wrote in the visitor's language come in it (issue #76).
        `/widget/changelog${query({ limit: LIMITS.updates, locale })}`,
        undefined,
        signal,
      );
      return entries.map(toUpdate);
    }),
    surface(surfaces.help, async () => {
      const { articles } = await api.request<{ articles: ApiArticle[] }>(
        "GET",
        `/widget/help/articles${query({ limit: LIMITS.articles, locale })}`,
        undefined,
        signal,
      );
      return articles.map(toArticle);
    }),
    surface(surfaces.messenger, () => loadConversations(api, signal)),
  ]);
  return {
    feedback: feedback ?? [],
    updates: updates ?? [],
    articles: articles ?? [],
    conversations: conversations ?? [],
    available: {
      feedback: feedback !== null,
      changelog: updates !== null,
      help: articles !== null,
      messenger: conversations !== null,
    },
  };
}

/** A post with its comments: the list leaves the discussion out. Null when it is closed. */
export async function loadPost(api: Api, id: string, signal?: AbortSignal) {
  const [post, comments] = await Promise.all([
    api.request<ApiPost>(
      "GET",
      `/widget/posts/${encodeURIComponent(id)}`,
      undefined,
      signal,
    ),
    api.request<{ items: ApiComment[] }>(
      "GET",
      `/widget/posts/${encodeURIComponent(id)}/comments${query({ limit: 100 })}`,
      undefined,
      signal,
    ),
  ]);
  return toPost(post, comments.items.map(toComment));
}

/** Up to three requests anywhere on the visible boards with a title like the text. */
export async function findSimilar(
  api: Api,
  text: string,
  signal?: AbortSignal,
) {
  const { items } = await api.request<{
    items: Array<{ id: string; title: string; voteCount?: number }>;
  }>(
    "GET",
    `/widget/posts/similar${query({ title: text, limit: 3 })}`,
    undefined,
    signal,
  );
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    ...(item.voteCount !== undefined && { votes: item.voteCount }),
  }));
}

/** One changelog entry: a deep link can point past the first page. */
export async function loadUpdate(
  api: Api,
  id: string,
  signal?: AbortSignal,
  locale?: string,
) {
  return toUpdate(
    await api.request<ApiChangelogEntry>(
      "GET",
      `/widget/changelog/${encodeURIComponent(id)}${query({ locale })}`,
      undefined,
      signal,
    ),
  );
}

/** An article with its body, by ID or slug. */
export async function loadArticle(
  api: Api,
  ref: string,
  locale?: string,
  signal?: AbortSignal,
) {
  return toArticle(
    await api.request<ApiArticle>(
      "GET",
      `/widget/help/articles/${encodeURIComponent(ref)}${query({ locale })}`,
      undefined,
      signal,
    ),
  );
}

/**
 * Brings threads up to date without a push channel: a changed conversation reads only the
 * messages after its newest one (`?after=`), a new one reads its latest page.
 */
export async function syncConversations(
  api: Api,
  current: readonly Conversation[],
  signal?: AbortSignal,
) {
  const { items } = await api.request<{
    items: Array<ApiConversation & { lastMessageAt: string }>;
  }>(
    "GET",
    `/widget/conversations${query({ limit: LIMITS.conversations })}`,
    undefined,
    signal,
  );
  const next = await Promise.all(
    items.map(async (item): Promise<Conversation> => {
      const known = current.find((thread) => thread.id === item.id);
      const last = known?.messages[known.messages.length - 1];
      if (!known || !last) {
        const thread = await api.request<Thread>(
          "GET",
          `/widget/conversations/${encodeURIComponent(item.id)}`,
          undefined,
          signal,
        );
        return toConversation(thread.conversation, thread.messages);
      }
      const fresh = toConversation(item, []);
      // Unchanged only when no new team message is unread and nothing is newer than our copy.
      if (
        known.unreadCount === item.unreadCount &&
        (last.sentAt ?? "") >= item.lastMessageAt
      )
        return { ...fresh, messages: known.messages };
      const page = await api.request<{ items: ApiMessage[] }>(
        "GET",
        `/widget/conversations/${encodeURIComponent(item.id)}/messages${query({ after: last.id, limit: 100 })}`,
        undefined,
        signal,
      );
      return {
        ...fresh,
        messages: mergeMessages(known.messages, page.items.map(toMessage)),
      };
    }),
  );
  return next.reverse();
}
