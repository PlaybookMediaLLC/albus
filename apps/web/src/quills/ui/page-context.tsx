import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./upstream";

export interface PageContextProps {
  /** The host-page context that the widget sent: pageUrl, browser and the host app's own metadata keys. */
  context: Record<string, string> | null | undefined;
  className?: string;
}

/**
 * The page and the browser that a widget visitor wrote from, then the keys the host app set with
 * `Quills.metadata`. Plain text, never a link: the values come from the visitor's page.
 */
export function PageContext({ context, className }: PageContextProps) {
  const { t } = useTranslation("quills");
  const rows = [
    { label: t("core.pageContext.page"), value: context?.pageUrl },
    { label: t("core.pageContext.browser"), value: context?.browser },
  ].filter((row) => row.value);
  // Without a page or a browser it is not widget context (a conversation-tracked post, say).
  if (!rows.length) return null;
  for (const [key, value] of Object.entries(context ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  ))
    if (key !== "pageUrl" && key !== "browser" && value)
      rows.push({ label: key, value });
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
