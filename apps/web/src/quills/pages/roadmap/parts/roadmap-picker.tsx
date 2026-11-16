import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "../../../ui/upstream";

export interface RoadmapPickerProps {
  roadmaps: ReadonlyArray<{ id: string; slug: string; name: string }>;
  /** The slug of the selected roadmap. */
  selected?: string;
  onSelect: (slug: string) => void;
}

/** The roadmap tabs. A pressed tab stays pressed: pressing it again changes nothing. */
export function RoadmapPicker({
  roadmaps,
  selected,
  onSelect,
}: RoadmapPickerProps) {
  const { t } = useTranslation("quills");
  return (
    <ToggleGroup
      aria-label={t("roadmap.roadmaps")}
      size="sm"
      className="flex-wrap"
      value={selected ? [selected] : []}
      onValueChange={([slug]) => {
        if (slug) onSelect(slug);
      }}
    >
      {roadmaps.map((item) => (
        <ToggleGroupItem
          key={item.id}
          value={item.slug}
          className="rounded-full px-3 before:rounded-full"
        >
          {item.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
