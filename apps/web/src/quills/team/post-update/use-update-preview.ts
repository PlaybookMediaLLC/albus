import { useEffect, useState } from "react";
import { usePreviewPostUpdate } from "../../hooks/team/use-preview-post-update";
import type { UpdateChannels, UpdateCounts } from "./update-channels";

export interface UpdateTargets {
  channels: UpdateChannels;
  segmentIds: string[];
  /** Null while the typed tags are not valid: nothing is counted then. */
  languages: string[] | null;
}

/**
 * The preview's counts for the current choice. A change waits briefly, so typing a language
 * sends one preview; an answer for an older choice is dropped.
 */
export function useUpdatePreview(
  workspaceId: string,
  postId: string,
  targets: UpdateTargets,
) {
  const preview = usePreviewPostUpdate();
  const [result, setResult] = useState<{
    counts: UpdateCounts;
    slackConnected: boolean;
  } | null>(null);
  const key = JSON.stringify(targets);
  useEffect(() => {
    setResult(null);
    const { channels, segmentIds, languages } = JSON.parse(
      key,
    ) as UpdateTargets;
    if (!languages) return;
    let current = true;
    const timer = setTimeout(() => {
      preview
        .mutateAsync({
          param: { workspaceId, postId },
          json: { channels, segmentIds, languages },
        })
        .then(
          (answer) => current && setResult(answer),
          () => undefined,
        );
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
    // The mutation object changes on every state change; the targets decide when to count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, postId, key]);
  return { ...result, failed: preview.isError && !result };
}
