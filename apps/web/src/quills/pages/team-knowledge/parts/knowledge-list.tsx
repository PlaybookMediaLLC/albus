import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ListHeader } from "../../../ui/inbox/list-header";
import {
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
} from "../../../ui/upstream";

/** The suggestions that the list can show. */
export type KnowledgeFilter = "open" | "approved" | "dismissed";

export interface KnowledgeListProps {
  status: KnowledgeFilter;
  onStatusChange: (status: KnowledgeFilter) => void;
  /** The result of the last decision. */
  message: string;
  /** The list in its query state. */
  children: ReactNode;
}

const filters = {
  open: { labelKey: "knowledge.open", titleKey: "knowledge.titleOpen" },
  approved: {
    labelKey: "knowledge.approved",
    titleKey: "knowledge.titleApproved",
  },
  dismissed: {
    labelKey: "knowledge.dismissed",
    titleKey: "knowledge.titleDismissed",
  },
} as const;

/** The knowledge list view: the header with the status filter, and a scroll area for the rows. */
export function KnowledgeList(props: KnowledgeListProps) {
  const { t } = useTranslation("quills");
  return (
    <>
      <ListHeader
        title={t(filters[props.status].titleKey)}
        filters={
          <MenuRadioGroup
            value={props.status}
            onValueChange={(value) =>
              props.onStatusChange(value as KnowledgeFilter)
            }
          >
            <MenuGroupLabel>{t("knowledge.filter")}</MenuGroupLabel>
            {(Object.keys(filters) as KnowledgeFilter[]).map((value) => (
              <MenuRadioItem key={value} value={value}>
                {t(filters[value].labelKey)}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 [&>[role=alert]]:m-4 [&>[role=status]]:px-4">
        <p
          role="status"
          className="text-sm text-muted-foreground [&:not(:empty)]:py-2"
        >
          {props.message}
        </p>
        {props.children}
      </div>
    </>
  );
}
