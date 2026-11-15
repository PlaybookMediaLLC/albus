import { useTranslation } from "react-i18next";
import type { GetOfficeHoursResponse } from "../../../api/team/get-office-hours";
import { problemOf } from "../../../core/problem-of";
import { useSetOfficeHours } from "../../../hooks/team/use-set-office-hours";
import { useTeamRuntime } from "../../../team/runtime";
import { SettingSwitchRow } from "../../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsNote,
  SettingsSection,
} from "../../../ui/upstream";
import { toIntervals } from "../week";
import { OfficeHoursForm } from "./office-hours-form";

export interface OfficeHoursSectionProps {
  workspaceId: string;
  hours: GetOfficeHoursResponse;
}

/** Office hours: on or off, the time zone and the weekly hours. Holidays stay as stored. */
export function OfficeHoursSection({
  workspaceId,
  hours,
}: OfficeHoursSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const set = useSetOfficeHours(team.viewer);
  const manage = team.permissions.manageSettings;
  const save = (json: GetOfficeHoursResponse) =>
    set.mutateAsync({ param: { workspaceId }, json });
  return (
    <SettingsSection title={t("settings-conversations.general.hours")}>
      <SettingsCard>
        <SettingSwitchRow
          title={t("settings-conversations.general.hoursOn")}
          description={t("settings-conversations.general.hoursOnText")}
          checked={hours.enabled}
          disabled={!manage}
          onCheckedChange={async (enabled) => {
            await save({ ...hours, enabled });
          }}
        />
        {/* The schedule only matters while office hours are on. */}
        {manage && hours.enabled ? (
          <OfficeHoursForm
            timezone={hours.timezone}
            intervals={hours.intervals}
            onSubmit={({ timezone, days }) =>
              problemOf(
                save({
                  ...hours,
                  timezone,
                  intervals: toIntervals(days, hours.intervals),
                }),
              )
            }
          />
        ) : null}
      </SettingsCard>
      {hours.enabled ? (
        <SettingsNote>
          {t("settings-conversations.general.hoursNote")}
        </SettingsNote>
      ) : null}
    </SettingsSection>
  );
}
