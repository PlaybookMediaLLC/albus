import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { portalHref } from "../core/portal-href";
import { PortalMenuPopup } from "./portal-menu-popup";
import { PortalSelectContent } from "./portal-select-content";
import { StatusIcon } from "./post/status-icon";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./upstream";

export interface BoardFiltersProps {
  boards: Array<{ id: string; name: string }>;
  boardId?: string;
  workspaceId: string;
  stages?: Array<{ value: string; label: string; color: string | null }>;
  stage?: string;
  onStageChange?: (value: string) => void;
}

/** The board and status controls of the board rail, as one compact row for small screens. */
export function BoardFilters(props: BoardFiltersProps) {
  const { t } = useTranslation("quills");
  const board = props.boards.find((item) => item.id === props.boardId);
  const stages = [
    { value: "", label: t("feedback.anyStatus"), color: null },
    ...(props.stages ?? []),
  ];
  return (
    <div className="flex min-w-0 items-center gap-2 md:hidden">
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label={t("feedback.boards")}
              className="min-w-0"
            />
          }
        >
          <span className="truncate">
            {board?.name ?? t("feedback.allFeedback")}
          </span>
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </MenuTrigger>
        <PortalMenuPopup align="start">
          {[{ id: "", name: t("feedback.allFeedback") }, ...props.boards].map(
            (item) => (
              <MenuItem
                key={item.id}
                className="aria-[current=page]:font-medium"
                render={
                  <a
                    href={portalHref(
                      props.workspaceId,
                      item.id ? `boards/${item.id}` : "",
                    )}
                    aria-current={
                      item.id === (props.boardId ?? "") ? "page" : undefined
                    }
                  />
                }
              >
                {item.name}
              </MenuItem>
            ),
          )}
        </PortalMenuPopup>
      </Menu>
      {props.stages?.length && props.onStageChange ? (
        <Select
          items={stages}
          value={props.stage ?? ""}
          onValueChange={(value) => props.onStageChange?.(value ?? "")}
        >
          <SelectTrigger
            aria-label={t("feedback.stage")}
            size="sm"
            className="w-auto min-w-0"
          >
            <SelectValue />
          </SelectTrigger>
          <PortalSelectContent align="start" alignItemWithTrigger={false}>
            {stages.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <span className="flex items-center gap-2">
                  {item.value ? (
                    <StatusIcon
                      stage={item.value}
                      color={item.color}
                      className="size-3.5"
                    />
                  ) : null}
                  {item.label}
                </span>
              </SelectItem>
            ))}
          </PortalSelectContent>
        </Select>
      ) : null}
    </div>
  );
}
