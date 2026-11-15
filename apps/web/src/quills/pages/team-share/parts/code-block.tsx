import { useTranslation } from "react-i18next";
import { Button, copyToClipboard } from "../../../ui/upstream";
import { tellCopy } from "../copy-rich";

export interface CodeBlockProps {
  /** Names the block and its copy button. */
  label: string;
  code: string;
}

/** A code snippet with line numbers and a Copy button at the top right. */
export function CodeBlock({ label, code }: CodeBlockProps) {
  const { t } = useTranslation("quills");
  return (
    <figure
      aria-label={label}
      className="relative overflow-hidden rounded-xl border border-border bg-muted/40"
    >
      <Button
        variant="outline"
        size="xs"
        className="absolute end-2 top-2"
        aria-label={t("team-share.copyNamed", { label })}
        onClick={() => void tellCopy(copyToClipboard(code), t)}
      >
        {t("team-share.copy")}
      </Button>
      <pre className="overflow-x-auto py-3 pe-20 font-mono text-xs leading-5">
        {code
          .split("\n")
          .map((text, index) => ({ number: index + 1, text }))
          .map((line) => (
            // The lines of a snippet never move, so the line number is a stable key.
            <code key={line.number} className="flex">
              <span
                aria-hidden="true"
                className="w-10 shrink-0 select-none pe-3 text-end text-muted-foreground"
              >
                {line.number}
              </span>
              <span className="whitespace-pre">{line.text}</span>
            </code>
          ))}
      </pre>
    </figure>
  );
}
