import { FileSpreadsheet } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsRow,
  StatusBadge,
  type StatusTone,
} from "../../../ui/upstream";

export interface RunRowProps {
  /** The file name. */
  name: string;
  status: "pending" | "dry_run" | "running" | "completed" | "failed";
  detail?: string;
  /** The problems of a failed run, one line each. */
  problems?: string[];
  /** An action, such as Download. */
  children?: ReactNode;
}

const states = {
  pending: ["warning", "settings-connections.data.status.pending"],
  dry_run: ["warning", "settings-connections.data.status.dry_run"],
  running: ["warning", "settings-connections.data.status.running"],
  completed: ["success", "settings-connections.data.status.completed"],
  failed: ["destructive", "settings-connections.data.status.failed"],
} satisfies Record<RunRowProps["status"], [StatusTone, string]>;

/** One import or export run: the file, its state, its totals and its problems. */
export function RunRow({
  name,
  status,
  detail,
  problems,
  children,
}: RunRowProps) {
  const { t } = useTranslation("quills");
  const [tone, label] = states[status];
  return (
    <SettingsRow
      icon={<FileSpreadsheet />}
      title={name}
      badge={<StatusBadge tone={tone}>{t(label)}</StatusBadge>}
      description={
        detail || problems?.length ? (
          <>
            {detail}
            {problems?.length ? (
              <ul className="mt-1 list-disc ps-4 text-destructive-foreground">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : undefined
      }
    >
      {children}
    </SettingsRow>
  );
}
