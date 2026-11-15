import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { portalHref } from "../core/portal-href";
import { PortalMenuPopup } from "../ui/portal-menu-popup";
import { Menu, MenuItem, MenuTrigger } from "../ui/upstream";

export interface PortalAccountMenuProps {
  workspaceId: string;
}

/**
 * The account menu of a signed-in portal visitor: My feedback, Preferences and Profile. One menu
 * keeps the header short, so the portal tabs have room.
 */
export function PortalAccountMenu({ workspaceId }: PortalAccountMenuProps) {
  const { t } = useTranslation("quills");
  const items = [
    { path: "my-feedback", label: t("my-feedback.nav") },
    { path: "preferences", label: t("core.navPreferences") },
    { path: "profile", label: t("core.navProfile") },
  ];
  return (
    <Menu>
      <MenuTrigger className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        {t("core.navAccount")}
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </MenuTrigger>
      <PortalMenuPopup align="end">
        {items.map((item) => (
          <MenuItem
            key={item.path}
            render={<a href={portalHref(workspaceId, item.path)} />}
          >
            {item.label}
          </MenuItem>
        ))}
      </PortalMenuPopup>
    </Menu>
  );
}
