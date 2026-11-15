import {
  Code,
  Headset,
  Mail,
  MailPlus,
  MessageCircle,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  copyToClipboard,
} from "../../../ui/upstream";
import { tellCopy } from "../copy-rich";

export interface ReadyMessagesProps {
  workspace: string;
  url: string;
}

/** Six messages that ask for feedback, one for each channel. An open row shows "Copy". */
export function ReadyMessages({ workspace, url }: ReadyMessagesProps) {
  const { t } = useTranslation("quills");
  const values = { workspace, url };
  const rows = [
    {
      id: "chat",
      Icon: MessageCircle,
      title: t("team-share.messages.chat"),
      text: t("team-share.messages.chatText"),
      body: t("team-share.messages.chatBody", values),
    },
    {
      id: "email",
      Icon: Mail,
      title: t("team-share.messages.email"),
      text: t("team-share.messages.emailText"),
      body: t("team-share.messages.emailBody", values),
    },
    {
      id: "community",
      Icon: Users,
      title: t("team-share.messages.community"),
      text: t("team-share.messages.communityText"),
      body: t("team-share.messages.communityBody", values),
    },
    {
      id: "support",
      Icon: Headset,
      title: t("team-share.messages.support"),
      text: t("team-share.messages.supportText"),
      body: t("team-share.messages.supportBody", values),
    },
    {
      id: "announcement",
      Icon: MailPlus,
      title: t("team-share.messages.announcement"),
      text: t("team-share.messages.announcementText"),
      body: t("team-share.messages.announcementBody", values),
    },
    {
      id: "developer",
      Icon: Code,
      title: t("team-share.messages.developer"),
      text: t("team-share.messages.developerText"),
      body: t("team-share.messages.developerBody", values),
    },
  ];
  return (
    <Accordion className="rounded-xl border border-border bg-card">
      {rows.map(({ id, Icon, title, text, body }) => (
        <AccordionItem
          key={id}
          value={id}
          className="border-border px-4 last:border-b-0"
        >
          <AccordionTrigger className="items-center gap-3 hover:no-underline">
            <Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
            />
            <span className="grid flex-1 text-start">
              <span className="font-medium">{title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {text}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionPanel className="grid gap-3">
            <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
              {body}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              aria-label={t("team-share.copyNamed", { label: title })}
              onClick={() => void tellCopy(copyToClipboard(body), t)}
            >
              {t("team-share.copy")}
            </Button>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
