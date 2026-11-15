import { useTranslation } from "react-i18next";
import { PersonAvatar } from "../../../ui/person-avatar";
import { Button, Skeleton } from "../../../ui/upstream";
import { copyRich, escapeHtml, tellCopy } from "../copy-rich";

export interface EmailSignatureProps {
  workspace: string;
  url: string;
  user: { name: string; image?: string | null };
}

/** A preview of an email signature that asks for feedback, and "Copy snippet". */
export function EmailSignature({ workspace, url, user }: EmailSignatureProps) {
  const { t } = useTranslation("quills");
  const from = t("team-share.signature.from", { name: user.name, workspace });
  const question = t("team-share.signature.question", { workspace });
  const link = t("team-share.signature.link");
  const html = `<p>${escapeHtml(from)}<br>${escapeHtml(question)}<br><a href="${escapeHtml(url)}">${escapeHtml(link)}</a></p>`;
  const text = `${from}\n${question}\n${link} ${url}`;
  return (
    <div className="grid gap-3">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <div aria-hidden="true" className="grid gap-2">
          <Skeleton className="h-2 w-4/5" />
          <Skeleton className="h-2 w-3/5" />
          <Skeleton className="h-2 w-2/5" />
        </div>
        <div className="flex gap-3 border-t border-border pt-4">
          <PersonAvatar
            name={user.name}
            avatarUrl={user.image}
            colored
            className="size-9 text-sm"
          />
          <div className="grid gap-1 text-sm">
            <p className="font-medium">{from}</p>
            <p className="text-muted-foreground">{question}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {link}
            </a>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-fit rounded-full"
        onClick={() => void tellCopy(copyRich(html, text), t)}
      >
        {t("team-share.signature.copy")}
      </Button>
    </div>
  );
}
