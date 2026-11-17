import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PortalSelectContent } from "../portal-select-content";
import {
  cn,
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../upstream";

export interface PostSortProps {
  sort: string;
  onSortChange: (value: string) => void;
  /** Hides the "Posts" label when the menu sits in a toolbar. */
  hideLabel?: boolean;
  /** Offers the shuffled order, for a board that uses it by default. */
  random?: boolean;
  /** Small-screen filters before the menu; the "Posts" label then stays for screen readers only. */
  filters?: ReactNode;
}

export function PostSort(props: PostSortProps) {
  const { t } = useTranslation("quills");
  const sorts = [
    { value: "votes", label: t("feedback.votes") },
    { value: "newest", label: t("feedback.newest") },
    { value: "oldest", label: t("feedback.oldest") },
    ...(props.random ? [{ value: "random", label: t("voting.random") }] : []),
  ];
  return (
    <div className="portal-post-sort flex items-center justify-between gap-2">
      {props.hideLabel ? null : (
        <h2
          className={cn(
            "text-xs font-normal text-muted-foreground",
            props.filters && "max-md:sr-only",
          )}
        >
          {t("feedback.posts")}
        </h2>
      )}
      {props.filters}
      <Select
        items={sorts}
        value={props.sort}
        onValueChange={(value) => {
          if (value !== null) props.onSortChange(value);
        }}
      >
        <SelectTrigger
          aria-label={t("feedback.sort")}
          size="sm"
          className="w-auto min-w-0"
        >
          <SelectValue />
        </SelectTrigger>
        <PortalSelectContent align="end" alignItemWithTrigger={false}>
          <SelectGroup>
            {sorts.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </PortalSelectContent>
      </Select>
    </div>
  );
}
