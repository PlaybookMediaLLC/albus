import { ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ListTagsResponse } from "../../api/team/list-tags";
import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuTrigger,
} from "../../ui/upstream";

export interface TagsPillProps {
  tags: ListTagsResponse["tags"];
  /** The ids of the chosen tags. */
  value: string[];
  onChange: (tagIds: string[]) => void;
}

/** The Tags pill of the New request footer: a menu of the workspace tags with a check on each chosen tag. */
export function TagsPill(props: TagsPillProps) {
  const { t } = useTranslation("quills");
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full before:rounded-full"
          />
        }
      >
        {props.value.length
          ? t("team-posts.tagCount", { count: props.value.length })
          : t("team-posts.tags")}
        <ChevronsUpDown aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="start">
        {props.tags.length ? null : (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("team-posts.noTags")}
          </p>
        )}
        {props.tags.map((tag) => (
          <MenuCheckboxItem
            key={tag.id}
            checked={props.value.includes(tag.id)}
            onCheckedChange={(checked) =>
              props.onChange(
                checked
                  ? [...props.value, tag.id]
                  : props.value.filter((id) => id !== tag.id),
              )
            }
          >
            {tag.name}
          </MenuCheckboxItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
