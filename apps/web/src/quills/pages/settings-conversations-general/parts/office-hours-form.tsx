import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";
import { Checkbox, Input, Label } from "../../../ui/upstream";
import { weekRows, type DayRow, type Interval } from "../week";

export interface OfficeHoursFormProps {
  timezone: string;
  intervals: readonly Interval[];
  onSubmit: (values: {
    timezone: string;
    days: DayRow[];
  }) => Promise<PortalProblem | void>;
}

// The time format of the API: 24-hour HH:MM.
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

// 2023-01-01 was a Sunday, so day N of the API is January 1 + N.
const dayName = (day: number, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    Date.UTC(2023, 0, 1 + day),
  );

/** The time zone and the opening hours of each day. */
export function OfficeHoursForm({
  timezone,
  intervals,
  onSubmit,
}: OfficeHoursFormProps) {
  const { t, i18n } = useTranslation("quills");
  const zones = Intl.supportedValuesOf("timeZone");
  // A closed day is not sent, so only an open day needs valid times.
  const time = (key: "start" | "end") => ({
    check: (row: DayRow) => !row.open || hhmm.test(row[key]),
    params: {
      message: t("settings-conversations.general.timeInvalid"),
      path: [key],
    },
  });
  const schema = z.object({
    timezone: z.string().min(1),
    days: z.array(
      z
        .object({
          day: z.number(),
          open: z.boolean(),
          start: z.string(),
          end: z.string(),
        })
        .refine(time("start").check, time("start").params)
        .refine(time("end").check, time("end").params)
        .refine((row) => !row.open || row.start !== row.end, {
          message: t("settings-conversations.general.sameTime"),
          path: ["end"],
        }),
    ),
  });
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ timezone, days: weekRows(intervals) }}
      submitKey="settings-conversations.save"
      className="max-w-none gap-4 px-4 py-3.5 [&_button[type=submit]]:self-end"
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <FormSelect
            control={form.control}
            name="timezone"
            label={t("settings-conversations.general.timezone")}
            options={(zones.includes(timezone)
              ? zones
              : [timezone, ...zones]
            ).map((zone) => ({ value: zone, label: zone }))}
          />
          {form.getValues("days").map((row, index) => {
            const errors = form.formState.errors.days?.[index];
            const startError = errors?.start?.message;
            const error = startError ?? errors?.end?.message;
            const name = dayName(row.day, i18n.language);
            return (
              <div
                key={row.day}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
              >
                <Label>
                  <Controller
                    control={form.control}
                    name={`days.${index}.open`}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  {name}
                </Label>
                <Input
                  type="time"
                  aria-label={t("settings-conversations.general.opens", {
                    day: name,
                  })}
                  aria-invalid={Boolean(startError)}
                  {...form.register(`days.${index}.start`)}
                />
                <Input
                  type="time"
                  aria-label={t("settings-conversations.general.closes", {
                    day: name,
                  })}
                  aria-invalid={Boolean(errors?.end?.message)}
                  {...form.register(`days.${index}.end`)}
                />
                {error ? (
                  <p
                    role="alert"
                    className="col-span-3 text-sm text-destructive"
                  >
                    {String(error)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </PortalForm>
  );
}
