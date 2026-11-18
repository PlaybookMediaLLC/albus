import type { ComponentProps } from "react";
import {
  Button,
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../upstream";

export interface IconButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "aria-label"
> {
  /** The accessible name. The tooltip shows the same text. */
  label: string;
  /** The side of the tooltip, such as "right" in the app rail. */
  side?: ComponentProps<typeof TooltipContent>["side"];
}

/**
 * An icon-only button with its name in a coss Tooltip. The tooltip shows `aria-keyshortcuts`
 * as keycaps, one for each space-separated key. For a menu or popover trigger,
 * render it from the trigger: `<MenuTrigger render={<IconButton label="More" />}>`.
 */
export function IconButton({
  label,
  side,
  children,
  ...props
}: IconButtonProps) {
  const keys = props["aria-keyshortcuts"]?.split(" ");
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            {...props}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        <span className="flex items-center gap-1.5">
          {label}
          {keys?.map((key) => (
            <Kbd key={key} aria-hidden="true" tone="tooltip">
              {key === "Escape" ? "Esc" : key}
            </Kbd>
          ))}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
