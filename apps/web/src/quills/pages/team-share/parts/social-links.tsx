import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { avatarTone } from "../../../core/avatar-tone";
import { cn } from "../../../ui/upstream";
import { socialLinks } from "../share-links";

export interface SocialLinksProps {
  workspace: string;
  url: string;
}

/** Share links for X, LinkedIn, Facebook and Reddit. They open the network in a new tab. */
export function SocialLinks({ workspace, url }: SocialLinksProps) {
  const { t } = useTranslation("quills");
  const links = socialLinks(
    url,
    t("team-share.social.post", { name: workspace }),
  );
  const rows = [
    {
      href: links.x,
      name: t("team-share.social.x"),
      text: t("team-share.social.xText"),
    },
    {
      href: links.linkedin,
      name: t("team-share.social.linkedin"),
      text: t("team-share.social.linkedinText"),
    },
    {
      href: links.facebook,
      name: t("team-share.social.facebook"),
      text: t("team-share.social.facebookText"),
    },
    {
      href: links.reddit,
      name: t("team-share.social.reddit"),
      text: t("team-share.social.redditText"),
    },
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <li key={row.href}>
          <a
            href={row.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/60"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                avatarTone(row.name),
              )}
            >
              {row.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{row.name}</span>
              <span className="block text-sm text-muted-foreground">
                {row.text}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
