import {
  IconFacePlusOutline18,
  IconHeartOutline18,
} from "nucleo-ui-essential-outline-18";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { reactionEmoji } from "../../core/reactions";
import { ConfirmAction } from "../confirm-action";
import { Button } from "../upstream";

export interface CommentReactionsProps {
  reactions: Array<{ emoji: string; count: number; reacted: boolean }>;
  /** Toggles a reaction; the reactions are read-only without it. */
  onReact?: (emoji: string, reacted: boolean) => Promise<void>;
}

// The heart is the like.
const LIKE = "❤️";
const round = "rounded-full before:rounded-full";

/** The like, the other reactions as toggles, and a picker for a new reaction. */
export function CommentReactions({
  reactions,
  onReact,
}: CommentReactionsProps) {
  const { t } = useTranslation("quills");
  const [picking, setPicking] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Closing the picker removes the focused emoji, so focus goes back to its toggle.
  const close = () => {
    setPicking(false);
    toggleRef.current?.focus();
  };
  const find = (emoji: string) =>
    reactions.find((reaction) => reaction.emoji === emoji);
  const toggle = (emoji: string) => onReact!(emoji, !find(emoji)?.reacted);
  const liked = find(LIKE);
  return (
    <>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <ConfirmAction
          labelKey="post.like"
          pressed={Boolean(liked?.reacted)}
          disabled={!onReact}
          variant="ghost"
          size="icon-xs"
          className={`${round} text-muted-foreground hover:text-foreground aria-pressed:text-foreground aria-pressed:[&_path]:fill-current`}
          onConfirm={() => toggle(LIKE)}
        >
          <IconHeartOutline18 aria-hidden="true" className="size-3.5" />
        </ConfirmAction>
        {liked?.count ? <span>{liked.count}</span> : null}
      </span>
      {reactions
        .filter((reaction) => reaction.emoji !== LIKE && reaction.count > 0)
        .map((reaction) => (
          <ConfirmAction
            key={reaction.emoji}
            labelKey="post.reaction"
            labelValues={{ emoji: reaction.emoji, count: reaction.count }}
            pressed={reaction.reacted}
            disabled={!onReact}
            variant="pill"
            onConfirm={() => toggle(reaction.emoji)}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            <span aria-hidden="true">{reaction.count}</span>
          </ConfirmAction>
        ))}
      {onReact ? (
        <span
          role="group"
          className="flex flex-wrap items-center gap-1"
          onKeyDown={(event) => {
            if (event.key === "Escape" && picking) close();
          }}
        >
          <Button
            ref={toggleRef}
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-expanded={picking}
            aria-label={t("post.addReaction")}
            className={`${round} text-muted-foreground hover:text-foreground`}
            onClick={() => setPicking(!picking)}
          >
            <IconFacePlusOutline18 aria-hidden="true" className="size-3.5" />
          </Button>
          {picking
            ? reactionEmoji
                .filter((emoji) => emoji !== LIKE)
                .map((emoji) => (
                  <ConfirmAction
                    key={emoji}
                    labelKey="post.reactWith"
                    labelValues={{ emoji }}
                    pressed={Boolean(find(emoji)?.reacted)}
                    variant="ghost"
                    size="icon-xs"
                    className={`${round} text-sm aria-pressed:bg-accent`}
                    onConfirm={async () => {
                      await toggle(emoji);
                      close();
                    }}
                  >
                    <span aria-hidden="true">{emoji}</span>
                  </ConfirmAction>
                ))
            : null}
        </span>
      ) : null}
    </>
  );
}
