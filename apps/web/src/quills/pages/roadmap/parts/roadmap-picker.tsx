import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "../../../ui/upstream";

export interface RoadmapPickerProps {
  roadmaps: ReadonlyArray<{ id: string; slug: string; name: string }>;
  selectedId?: string;
  onSelect: (slug: string) => void;
}

/** The roadmap tabs. A pressed tab stays pressed: pressing it again changes nothing. */
export function RoadmapPicker({
  roadmaps,
  selectedId,
  onSelect,
}: RoadmapPickerProps) {
  const { t } = useTranslation("quills");
  return (
    <ToggleGroup
      aria-label={t("roadmap.roadmaps")}
      size="sm"
      className="flex-wrap"
      value={selectedId ? [selectedId] : []}
      onValueChange={(value) => {
        const item = roadmaps.find((entry) => entry.id === value[0]);
        if (item) onSelect(item.slug);
      }}
    >
      {roadmaps.map((item) => (
        <ToggleGroupItem
          key={item.id}
          value={item.id}
          className="rounded-full px-3 before:rounded-full"
        >
          {item.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
