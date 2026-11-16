import { Smile } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../../ui/inbox/icon-button";
import { Popover, PopoverPopup, PopoverTrigger } from "../../../ui/upstream";

// ponytail: a fixed set of common emoji, no picker library; the OS picker covers the rest.
const EMOJI = [
  "🙂",
  "😀",
  "😂",
  "😊",
  "😍",
  "😅",
  "🤔",
  "😢",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🙏",
  "👀",
  "💡",
  "🔥",
  "🎉",
  "❤️",
  "✅",
  "❌",
  "⚠️",
  "🚀",
  "⏳",
  "📎",
];

export interface EmojiButtonProps {
  disabled?: boolean;
  /** Runs with the chosen emoji; the popup then closes. */
  onPick: (emoji: string) => void;
}

/** The emoji button of the composer toolbar: a small grid of common emoji. */
export function EmojiButton(props: EmojiButtonProps) {
  const { t } = useTranslation("quills");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <IconButton
            label={t("team-conversations.emoji.open")}
            disabled={props.disabled}
          />
        }
      >
        <Smile aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={t("team-conversations.emoji.insert", { emoji })}
              className="grid size-8 place-items-center rounded-md text-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                props.onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
