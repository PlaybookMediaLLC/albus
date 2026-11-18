import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "../../../ui/upstream";
import { CARD_FIELDS, type CardDisplay, type CardField } from "../card-display";

export interface RoadmapDisplayMenuProps {
  display: CardDisplay;
  onToggle: (field: CardField, on: boolean) => void;
}

/** The Display button of the roadmap toolbar: which details the cards show. */
export function RoadmapDisplayMenu({
  display,
  onToggle,
}: RoadmapDisplayMenuProps) {
  const { t } = useTranslation("quills");
  const labels: Record<CardField, string> = {
    board: t("team-roadmap.display.board"),
    author: t("team-roadmap.display.author"),
    counts: t("team-roadmap.display.counts"),
    created: t("team-roadmap.display.created"),
  };
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            variant="outline"
            label={t("team-roadmap.display.label")}
          />
        }
      >
        <SlidersHorizontal aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>
            {t("team-roadmap.display.properties")}
          </MenuGroupLabel>
          {CARD_FIELDS.map((field) => (
            <MenuCheckboxItem
              key={field}
              checked={display[field]}
              onCheckedChange={(on) => onToggle(field, on)}
            >
              {labels[field]}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
