import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSummarizePost } from "../../../hooks/team/use-summarize-post";
import {
  Button,
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "../../../ui/upstream";

export interface PostAiProps {
  workspaceId: string;
  postId: string;
  /** The chip style of the row. */
  className?: string;
}

/**
 * The AI chip of a request (design section 3): an AI summary of the request and its comments.
 * A teammate cannot tell before the request whether AI is on, so a 409 says that AI is not set up.
 * The caller keys it by the post, so a summary never shows on the next request.
 */
export function PostAi({ workspaceId, postId, className }: PostAiProps) {
  const { t } = useTranslation("quills");
  const summarize = useSummarizePost();
  const run = () => summarize.mutate({ param: { workspaceId, postId } });
  const kind = summarize.error?.kind;
  return (
    <Popover
      onOpenChange={(open) => {
        if (open && summarize.isIdle) run();
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className={className} />}
      >
        <Sparkles aria-hidden="true" />
        {t("team-post.ai.chip")}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-80">
        <PopoverTitle className="text-sm">
          {t("team-post.ai.title")}
        </PopoverTitle>
        <div role="status" className="mt-2 text-sm">
          {summarize.isPending ? (
            t("team-post.ai.working")
          ) : summarize.data ? (
            <p className="whitespace-pre-wrap">{summarize.data.summary}</p>
          ) : kind === "conflict" ? (
            t("team-post.ai.off")
          ) : null}
        </div>
        {kind && kind !== "conflict" ? (
          <div role="alert" className="mt-2 grid gap-2 text-sm">
            <p className="text-destructive-foreground">
              {t("team-post.ai.failed")}
            </p>
            <Button size="xs" variant="outline" onClick={run}>
              {t("core.retry")}
            </Button>
          </div>
        ) : null}
      </PopoverPopup>
    </Popover>
  );
}
