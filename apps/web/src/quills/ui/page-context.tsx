import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./upstream";

export interface PageContextProps {
  /** The host-page context that the widget sent. Other keys, such as the host app's own, stay out. */
  context: Record<string, string> | null | undefined;
  className?: string;
}

/**
 * The page and the browser that a widget visitor wrote from. Plain text, never a link: the values
 * come from the visitor's page.
 */
export function PageContext({ context, className }: PageContextProps) {
  const { t } = useTranslation("quills");
  const rows = [
    { label: t("core.pageContext.page"), value: context?.pageUrl },
    { label: t("core.pageContext.browser"), value: context?.browser },
  ].filter((row) => row.value);
  if (!rows.length) return null;
  return (
    <dl
      className={cn(
        "grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs",
        className,
      )}
    >
      {rows.map((row) => (
        <Fragment key={row.label}>
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="break-all">{row.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
