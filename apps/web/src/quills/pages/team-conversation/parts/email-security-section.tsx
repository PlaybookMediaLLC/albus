import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ListConversationMessagesResponse } from "../../../api/team/list-conversation-messages";
import { relativeTime } from "../../../core/relative-time";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { cn } from "../../../ui/upstream";

export type EmailAuth = NonNullable<
  ListConversationMessagesResponse["items"][number]["emailAuth"]
>;
type Result = EmailAuth["spf"];

export interface EmailSecuritySectionProps {
  auth: EmailAuth;
  /** When the mail with these results arrived. */
  receivedAt: string;
}

const looks: Record<
  Result,
  { icon: typeof CircleCheck; tone: string; key: string }
> = {
  pass: {
    icon: CircleCheck,
    tone: "text-success",
    key: "team-conversations.emailSecurity.pass",
  },
  fail: {
    icon: CircleX,
    tone: "text-destructive",
    key: "team-conversations.emailSecurity.fail",
  },
  none: {
    icon: CircleMinus,
    tone: "text-muted-foreground",
    key: "team-conversations.emailSecurity.none",
  },
};

/**
 * The receiving server's SPF, DKIM and DMARC results of the newest inbound mail, as a right-panel
 * section. The API sends results only from a trusted receiving server.
 */
export function EmailSecuritySection({
  auth,
  receivedAt,
}: EmailSecuritySectionProps) {
  const { t, i18n } = useTranslation("quills");
  // Protocol names: the same in every language.
  const checks = [
    ["SPF", auth.spf],
    ["DKIM", auth.dkim],
    ["DMARC", auth.dmarc],
  ] as const;
  return (
    <PanelSection
      title={t("team-conversations.emailSecurity.title")}
      action={
        <time dateTime={receivedAt} className="text-xs text-muted-foreground">
          {relativeTime(receivedAt, i18n.language)}
        </time>
      }
    >
      <ul className="grid grid-cols-3 divide-x divide-border rounded-full border border-border text-sm">
        {checks.map(([name, result]) => {
          const { icon: Icon, tone, key } = looks[result];
          return (
            <li
              key={name}
              className="flex items-center justify-center gap-1.5 py-1.5"
            >
              <Icon aria-hidden="true" className={cn("size-4", tone)} />
              {name}
              <span className="sr-only">{t(key)}</span>
            </li>
          );
        })}
      </ul>
    </PanelSection>
  );
}
