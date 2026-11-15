import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "./inbox/icon-button";
import { copyToClipboard, toast } from "./upstream";

export interface CopyFieldProps {
  value: string;
  /** What the value is, such as "Workspace ID". It names the field and the copy button. */
  label: string;
  /** Shows only the first 12 characters of a secret. The button still copies all of it. */
  masked?: boolean;
}

/** A long value keeps its start and its end, so two similar values stay different. */
const shorten = (value: string, masked?: boolean) =>
  masked
    ? `${value.slice(0, 12)}…`
    : value.length > 48
      ? `${value.slice(0, 28)}…${value.slice(-16)}`
      : value;

/** A gray monospace value with a copy button (settings spec 1.7). */
export function CopyField({ value, label, masked }: CopyFieldProps) {
  const { t } = useTranslation("quills");
  // The helper also works on an instance that is reached over plain HTTP.
  const copy = async () =>
    (await copyToClipboard(value))
      ? toast.success(t("settings.copied"))
      : toast.error(t("settings.copyFailed"));
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-8 min-w-0 max-w-full items-center gap-1 rounded-lg bg-muted ps-3 pe-0.5"
    >
      <code className="min-w-0 flex-1 truncate font-mono text-xs">
        {shorten(value, masked)}
      </code>
      <IconButton
        label={t("settings.copy", { label })}
        onClick={() => void copy()}
      >
        <Copy aria-hidden="true" />
      </IconButton>
    </div>
  );
}
