import { useEffect, useRef, useState } from "react";
import { suggestFeedback } from "./search.js";
import type { FeedbackPost, SimilarRequest } from "./types.js";

type Find = (
  text: string,
  signal: AbortSignal,
) => Promise<readonly SimilarRequest[]>;

/** Requests like the draft: the whole board from the API once it answers, then the loaded posts. */
export function useSimilarRequests(
  draft: string,
  posts: readonly FeedbackPost[],
  find: Find | undefined,
  enabled: boolean,
): readonly SimilarRequest[] {
  const text = draft.trim();
  const [remote, setRemote] = useState<readonly SimilarRequest[]>([]);
  // The adapter makes a new function per render; a ref keeps one lookup per pause in typing.
  const findRef = useRef(find);
  findRef.current = find;
  const searchable = enabled && !!find && text.length >= 3;
  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      findRef.current?.(text.slice(0, 200), controller.signal).then(
        (items) => !controller.signal.aborted && setRemote(items),
        // The loaded posts still give suggestions when the lookup fails.
        () => {},
      );
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchable, text]);
  if (!enabled || text.length < 3) return [];
  const loaded = new Map(posts.map((post) => [post.id, post]));
  const seen = new Set<string>();
  return [...remote, ...suggestFeedback(posts, text)]
    .filter((item) => !seen.has(item.id) && !!seen.add(item.id))
    .slice(0, 3)
    .map((item) => {
      const post = loaded.get(item.id);
      return post
        ? {
            id: post.id,
            title: post.title,
            votes: post.votes,
            voted: post.voted,
          }
        : {
            id: item.id,
            title: item.title,
            votes: item.votes,
            voted: item.voted,
          };
    });
}
