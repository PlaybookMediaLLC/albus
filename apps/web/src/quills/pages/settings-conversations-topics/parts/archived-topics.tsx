import { Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";

export interface ArchivedTopicsProps {
  items: readonly { id: string; name: string; color: string }[];
  /** True while a restore runs. The buttons are then off. */
  pending: boolean;
  onRestore: (id: string) => void;
}

/** The archived topics, each with a Restore button. The section is empty without topics. */
export function ArchivedTopics({
  items,
  pending,
  onRestore,
}: ArchivedTopicsProps) {
  const { t } = useTranslation("quills");
  if (!items.length) return null;
  return (
    <SettingsSection
      title={t("settings-conversations.topics.archivedTitle")}
      description={t("settings-conversations.topics.archivedText")}
    >
      <SettingsCard>
        {items.map((item) => (
          <SettingsRow
            key={item.id}
            title={
              <span className="flex min-w-0 items-center gap-3">
                <Tag
                  aria-hidden="true"
                  color={item.color}
                  className="size-4 shrink-0"
                />
                <span className="truncate font-normal">{item.name}</span>
              </span>
            }
          >
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              aria-label={t("settings-conversations.topics.restoreName", {
                name: item.name,
              })}
              onClick={() => onRestore(item.id)}
            >
              {t("settings-conversations.topics.restore")}
            </Button>
          </SettingsRow>
        ))}
      </SettingsCard>
    </SettingsSection>
  );
}
