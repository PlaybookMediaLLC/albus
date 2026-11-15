import { useContext, type ComponentProps } from "react";
import { PortalThemeContext } from "../core/portal-theme-context";
import { MenuPopup } from "./upstream";

export type PortalMenuPopupProps = ComponentProps<typeof MenuPopup>;

/** A menu popup of the portal. It renders outside PortalShell, so it carries the portal theme. */
export function PortalMenuPopup({ style, ...props }: PortalMenuPopupProps) {
  const theme = useContext(PortalThemeContext);
  // quills-web-allow C19: Popups render outside PortalShell and must carry its scoped workspace theme.
  return <MenuPopup style={{ ...theme, ...style }} {...props} />;
}
