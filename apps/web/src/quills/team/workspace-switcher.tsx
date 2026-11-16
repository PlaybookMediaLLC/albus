import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  getInitials,
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "../ui/upstream";
import { IconButton } from "../ui/inbox/icon-button";
import { WorkspaceMenuItems } from "./workspace-menu-items";

export interface WorkspaceSwitcherProps {
  workspaceId: string;
  workspaceName?: string;
  workspaceLogo?: string | null;
  /** The caller's workspace role, shown as a small badge. */
  workspaceRole?: string;
}

const roles: Record<string, string> = {
  owner: "team.roles.owner",
  admin: "team.roles.admin",
  member: "team.roles.member",
};

/** The workspace logo at the top of the rail: switch to another workspace or go back to Kaneo. */
export function WorkspaceSwitcher({
  workspaceId,
  workspaceName,
  workspaceLogo,
  workspaceRole: role,
}: WorkspaceSwitcherProps) {
  const { t } = useTranslation("quills");
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            side="right"
            size="icon-lg"
            className="hover:bg-sidebar-accent"
            label={workspaceName ?? t("team.switcher")}
          />
        }
      >
        <Avatar aria-hidden="true" className="size-7 rounded-lg">
          {workspaceLogo ? (
            // quills-web-allow C3: the logo is decorative, so its image needs an empty alt.
            <AvatarImage src={workspaceLogo} alt="" />
          ) : null}
          <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold text-foreground ring-1 ring-border ring-inset">
            {getInitials(workspaceName, "")}
          </AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup side="right" align="start" className="min-w-60">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {workspaceName}
          </span>
          {role ? (
            <Badge variant="outline" size="sm" className="shrink-0">
              {roles[role] ? t(roles[role]) : role}
            </Badge>
          ) : null}
        </div>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>{t("team.switcher")}</MenuGroupLabel>
          <WorkspaceMenuItems />
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          render={
            <Link
              to="/dashboard/workspace/$workspaceId"
              params={{ workspaceId }}
            />
          }
        >
          <ArrowLeft aria-hidden="true" />
          {t("team.back")}
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
