import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSetAgentAvailability } from "../../../hooks/team/use-set-agent-availability";
import { Button, SettingsRow, toast } from "../../../ui/upstream";

export interface AvailabilityRowProps {
  workspaceId: string;
}

type Availability = "online" | "away";

/**
 * "My availability". No route reads the current value, so the row shows only the value that
 * this page set.
 */
export function AvailabilityRow({ workspaceId }: AvailabilityRowProps) {
  const { t } = useTranslation("quills");
  const set = useSetAgentAvailability();
  const [current, setCurrent] = useState<Availability | null>(null);
  const choose = async (availability: Availability) => {
    try {
      await set.mutateAsync({
        param: { workspaceId },
        json: { availability },
      });
      setCurrent(availability);
    } catch {
      toast.error(t("settings-conversations.operators.availabilityFailed"));
    }
  };
  const button = (availability: Availability, label: string) => (
    <Button
      variant={current === availability ? "secondary" : "outline"}
      size="sm"
      aria-pressed={current === availability}
      disabled={set.isPending}
      onClick={() => void choose(availability)}
    >
      {label}
    </Button>
  );
  return (
    <SettingsRow
      title={t("settings-conversations.operators.availability")}
      description={t("settings-conversations.operators.availabilityText")}
    >
      {button("online", t("settings-conversations.operators.online"))}
      {button("away", t("settings-conversations.operators.away"))}
    </SettingsRow>
  );
}
