import { Smile } from "lucide-react";
import { useTranslation } from "react-i18next";
import { reactionEmoji } from "../../core/reactions";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../upstream";
import { IconButton } from "./icon-button";

export interface EmojiMenuProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}

/** The emoji button of a composer toolbar. It offers the reaction emoji set, with no picker library. */
export function EmojiMenu({ onPick, disabled }: EmojiMenuProps) {
  const { t } = useTranslation("quills");
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            className="text-muted-foreground"
            label={t("inbox.emoji")}
            disabled={disabled}
          />
        }
      >
        <Smile aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="start" className="grid grid-cols-7 gap-0.5 p-1">
        {reactionEmoji.map((emoji) => (
          <MenuItem
            key={emoji}
            aria-label={t("inbox.insertEmoji", { emoji })}
            className="justify-center px-1.5 text-base"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
