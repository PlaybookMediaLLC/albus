import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem, PortalProblemKind } from "../core/types";
import {
  Button,
  Alert,
  AlertDescription,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  Skeleton,
} from "./upstream";

const problemKeys: Record<PortalProblemKind, string> = {
  authRequired: "core.problem.authRequired",
  conflict: "core.problem.conflict",
  failed: "core.problem.failed",
  gone: "core.problem.gone",
  invalid: "core.problem.invalid",
  noAccess: "core.problem.noAccess",
  notFound: "core.problem.notFound",
  rateLimited: "core.problem.rateLimited",
};

export interface StateViewProps {
  loading?: boolean;
  empty?: boolean;
  problem?: PortalProblem | null;
  children: ReactNode;
  onRetry?: () => void;
  /** The empty state: an icon and a line (the generic line by default). */
  emptyIcon?: ReactNode;
  emptyDescription?: string;
  /** A full empty state, such as an EmptyState with a drawing. It replaces the icon and line. */
  emptyState?: ReactNode;
  /** Placeholder rows for the first load of a list, so the rows do not jump in. */
  rows?: number;
}

export function StateView({
  loading,
  empty,
  problem,
  children,
  onRetry,
  emptyIcon,
  emptyDescription,
  emptyState,
  rows,
}: StateViewProps) {
  const { t } = useTranslation("quills");
  const [now, setNow] = useState(Date.now);
  const retryAt = problem?.kind === "rateLimited" ? problem.retryAt : undefined;
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const seconds = Math.max(0, Math.ceil(((retryAt ?? now) - now) / 1000));
  if (loading && rows)
    return (
      <div role="status" className="grid gap-1">
        <span className="sr-only">{t("core.loading")}</span>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  // The placeholder shows only after 250 ms (Kaneo's delayed-reveal), so a fast answer does not flash.
  if (loading)
    return (
      <div className="delayed-reveal grid gap-3 py-2" role="status">
        <span className="sr-only">{t("core.loading")}</span>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  if (problem)
    return (
      <Alert role="alert">
        <AlertDescription className="text-foreground">
          {t(problemKeys[problem.kind])}
        </AlertDescription>
        {onRetry &&
        (problem.kind === "failed" || problem.kind === "rateLimited") ? (
          <Button className="mt-3" disabled={seconds > 0} onClick={onRetry}>
            {seconds > 0
              ? t("core.retryAfter", { count: seconds })
              : t("core.retry")}
          </Button>
        ) : null}
      </Alert>
    );
  if (empty && emptyState) return emptyState;
  if (empty)
    return (
      <Empty role="status">
        <EmptyHeader>
          {emptyIcon ? (
            <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
          ) : null}
          <EmptyDescription>
            {emptyDescription ?? t("core.empty")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return children;
}
