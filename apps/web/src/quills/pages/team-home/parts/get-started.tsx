import { Link } from "@tanstack/react-router";
import { AppWindow, Palette, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { teamHref } from "../../../team/team-href";
import { IconButton } from "../../../ui/inbox/icon-button";
import { HeroOrbit } from "../../../ui/illustrations/hero-orbit";
import { StartArt } from "../../../ui/illustrations/start-art";
import { useGetStartedHidden } from "../get-started-hidden";

export interface GetStartedProps {
  workspaceId: string;
}

const steps = [
  { id: "branding", path: "/settings/branding", icon: Palette },
  { id: "widget", path: "/settings/conversations/widget", icon: AppWindow },
  { id: "team", path: "/settings/team", icon: Users },
] as const;

/** First-run cards on the team home: three setup steps, hidden for good on this browser. */
export function GetStarted({ workspaceId }: GetStartedProps) {
  const { t } = useTranslation("quills");
  const [hidden, hide] = useGetStartedHidden(workspaceId);
  if (hidden) return null;
  const copy = {
    branding: [
      t("team.home.start.branding"),
      t("team.home.start.brandingText"),
    ],
    widget: [t("team.home.start.widget"), t("team.home.start.widgetText")],
    team: [t("team.home.start.team"), t("team.home.start.teamText")],
  };
  return (
    <section
      aria-labelledby="team-home-start"
      className="group relative isolate grid gap-4 pt-2"
    >
      <HeroOrbit />
      <div className="flex items-start gap-4">
        <StartArt />
        <div className="grid min-w-0 flex-1 gap-1 self-center">
          <h2 id="team-home-start" className="text-base font-semibold">
            {t("team.home.start.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("team.home.start.text")}
          </p>
        </div>
        <IconButton label={t("team.home.start.hide")} onClick={hide}>
          <X aria-hidden="true" />
        </IconButton>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ id, path, icon: Icon }) => (
          <li key={id}>
            <Link
              to={teamHref(workspaceId, path)}
              className="grid h-full content-start gap-2 rounded-lg border border-border bg-background p-4 outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <span className="text-sm font-medium">{copy[id][0]}</span>
              <span className="text-sm text-muted-foreground">
                {copy[id][1]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
