import { useTranslation } from "react-i18next";
import { sourceKeys, sources, type Source } from "./sources";
import { PortalSelectContent } from "../../ui/portal-select-content";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/upstream";

export interface SourceSelectProps {
  value: Source;
  onChange: (source: Source) => void;
}

/** A compact select of where the teammate heard the request: call, meeting, email, chat or other. */
export function SourceSelect({ value, onChange }: SourceSelectProps) {
  const { t } = useTranslation("quills");
  const options = sources.map((source) => ({
    value: source,
    label: t(sourceKeys[source]!),
  }));
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => onChange(next as Source)}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("team-posts.source")}
        className="w-auto min-w-0 rounded-full before:rounded-full"
      >
        <SelectValue />
      </SelectTrigger>
      <PortalSelectContent alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </PortalSelectContent>
    </Select>
  );
}
