import { useTranslation } from "react-i18next";
import type { GetWidgetSettingsResponse } from "../../../api/team/get-widget-settings";
import type { UpdateWidgetSettingsRequest } from "../../../api/team/update-widget-settings";
import { SettingSelect } from "../../../ui/setting-select";
import { SettingSwitchRow } from "../../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";
import { HeroImageRow } from "./hero-image-row";

type Home = NonNullable<UpdateWidgetSettingsRequest["json"]["home"]>;
type Card = NonNullable<Home["cards"]>[number];

export interface HomeSectionProps {
  workspaceId: string;
  home: GetWidgetSettingsResponse["home"];
  locked: boolean;
  onSave: (home: Home) => Promise<void>;
}

const styles = ["plain", "gradient", "pattern", "image"] as const;
const styleKeys = {
  plain: "settings-conversations.widget.styles.plain",
  gradient: "settings-conversations.widget.styles.gradient",
  pattern: "settings-conversations.widget.styles.pattern",
  image: "settings-conversations.widget.styles.image",
};
const cardKeys: Record<string, string> = {
  feedback: "settings-conversations.widget.cards.feedback",
  new_conversation: "settings-conversations.widget.cards.new_conversation",
  article_search: "settings-conversations.widget.cards.article_search",
  latest_updates: "settings-conversations.widget.cards.latest_updates",
  link: "settings-conversations.widget.cards.link",
};

/** The Home tab of the widget: the header style, the header image and the cards. */
export function HomeSection({
  workspaceId,
  home,
  locked,
  onSave,
}: HomeSectionProps) {
  const { t } = useTranslation("quills");
  // The API replaces the card list whole, so each card goes back as it was stored.
  const withCard = (id: string, enabled: boolean): Card[] =>
    home.cards.map((card) => ({
      id: card.id,
      type: card.type as Card["type"],
      enabled: card.id === id ? enabled : card.enabled,
      audience: card.audience as Card["audience"],
      ...(card.title !== null && { title: card.title }),
      ...(card.subtitle !== null && { subtitle: card.subtitle }),
      ...(card.url !== null && { url: card.url }),
    }));
  return (
    <SettingsSection title={t("settings-conversations.widget.home")}>
      <SettingsCard>
        <SettingsRow
          title={t("settings-conversations.widget.style")}
          description={t("settings-conversations.widget.styleText")}
        >
          <SettingSelect
            label={t("settings-conversations.widget.style")}
            value={home.headerStyle as (typeof styles)[number]}
            options={styles.map((style) => ({
              value: style,
              label: t(styleKeys[style]),
            }))}
            disabled={locked}
            onValueChange={(headerStyle) => onSave({ headerStyle })}
          />
        </SettingsRow>
        {locked ? null : <HeroImageRow workspaceId={workspaceId} />}
        {home.cards.map((card) => (
          <SettingSwitchRow
            key={card.id}
            title={card.title ?? t(cardKeys[card.type] ?? card.type)}
            description={card.subtitle ?? undefined}
            checked={card.enabled}
            disabled={locked}
            onCheckedChange={(enabled) =>
              onSave({ cards: withCard(card.id, enabled) })
            }
          />
        ))}
      </SettingsCard>
    </SettingsSection>
  );
}
