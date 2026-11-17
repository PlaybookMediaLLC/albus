import { useTranslation } from "react-i18next";
import { SettingSelect } from "../../../ui/setting-select";
import { SettingsRow } from "../../../ui/upstream";

export type ReplyTime = "minutes" | "hours" | "day";

export interface ReplyTimeRowProps {
  value: ReplyTime | null;
  disabled: boolean;
  onChange: (value: ReplyTime | null) => Promise<void>;
}

/** The reply time that the widget's Home tab shows customers; none hides the line. */
export function ReplyTimeRow({ value, disabled, onChange }: ReplyTimeRowProps) {
  const { t } = useTranslation("quills");
  return (
    <SettingsRow
      title={t("settings-conversations.widget.replyTime")}
      description={t("settings-conversations.widget.replyTimeText")}
    >
      <SettingSelect
        label={t("settings-conversations.widget.replyTime")}
        value={value ?? "none"}
        options={[
          {
            value: "none",
            label: t("settings-conversations.widget.replyTimes.none"),
          },
          {
            value: "minutes",
            label: t("settings-conversations.widget.replyTimes.minutes"),
          },
          {
            value: "hours",
            label: t("settings-conversations.widget.replyTimes.hours"),
          },
          {
            value: "day",
            label: t("settings-conversations.widget.replyTimes.day"),
          },
        ]}
        disabled={disabled}
        onValueChange={(next) => onChange(next === "none" ? null : next)}
      />
    </SettingsRow>
  );
}
