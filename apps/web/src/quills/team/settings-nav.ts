import {
  AppWindow,
  CircleUserRound,
  CreditCard,
  DatabaseBackup,
  Globe,
  Headset,
  KeyRound,
  Languages,
  Lock,
  type LucideIcon,
  Mail,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Palette,
  Puzzle,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import type { ListSettingsResponse } from "../api/team/list-settings";
import type { TeamNavSection } from "./nav";
import { teamHref } from "./team-href";

type SettingsModule = keyof ListSettingsResponse["modules"];

interface SettingsView {
  id: string;
  labelKey: string;
  /** The path after /feedback/{id}/settings. */
  path: string;
  icon: LucideIcon;
  /** Shown only when this Quills module is on. */
  module?: SettingsModule;
  /** Shown only when the instance bills workspaces. */
  billing?: true;
}

const sections: readonly {
  id: string;
  labelKey: string;
  items: readonly SettingsView[];
}[] = [
  {
    id: "personal",
    labelKey: "settings.sections.personal",
    items: [
      {
        id: "account",
        labelKey: "settings.nav.account",
        path: "/account",
        icon: CircleUserRound,
      },
    ],
  },
  {
    id: "workspace",
    labelKey: "settings.sections.workspace",
    items: [
      {
        id: "branding",
        labelKey: "settings.nav.branding",
        path: "/branding",
        icon: Palette,
      },
      {
        id: "languages",
        labelKey: "settings.nav.languages",
        path: "/languages",
        icon: Languages,
        module: "helpCenter",
      },
      {
        id: "domain",
        labelKey: "settings.nav.domain",
        path: "/domain",
        icon: Globe,
      },
      { id: "team", labelKey: "settings.nav.team", path: "/team", icon: Users },
      {
        id: "billing",
        labelKey: "settings.nav.billing",
        path: "/billing",
        icon: CreditCard,
        billing: true,
      },
    ],
  },
  {
    id: "product",
    labelKey: "settings.sections.product",
    items: [
      {
        id: "feedback",
        labelKey: "settings.nav.feedback",
        path: "/feedback",
        icon: MessageSquare,
        module: "feedback",
      },
      {
        id: "changelog",
        labelKey: "settings.nav.changelog",
        path: "/changelog",
        icon: Megaphone,
        module: "changelog",
      },
      {
        id: "privacy",
        labelKey: "settings.nav.privacy",
        path: "/privacy",
        icon: Shield,
      },
      {
        id: "login",
        labelKey: "settings.nav.login",
        path: "/login",
        icon: Lock,
      },
    ],
  },
  {
    id: "conversations",
    labelKey: "settings.sections.conversations",
    items: [
      {
        id: "general",
        labelKey: "settings.nav.general",
        path: "/conversations/general",
        icon: MessagesSquare,
        module: "supportInbox",
      },
      {
        id: "operators",
        labelKey: "settings.nav.operators",
        path: "/conversations/operators",
        icon: Headset,
        module: "supportInbox",
      },
      {
        id: "topics",
        labelKey: "settings.nav.topics",
        path: "/conversations/topics",
        icon: Tag,
        module: "supportInbox",
      },
      {
        id: "email",
        labelKey: "settings.nav.email",
        path: "/conversations/email",
        icon: Mail,
        module: "supportInbox",
      },
      {
        id: "widget",
        labelKey: "settings.nav.widget",
        path: "/conversations/widget",
        icon: AppWindow,
      },
      {
        id: "ai",
        labelKey: "settings.nav.ai",
        path: "/conversations/ai",
        icon: Sparkles,
        module: "supportInbox",
      },
      {
        id: "moderation",
        labelKey: "settings.nav.moderation",
        path: "/conversations/moderation",
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: "connections",
    labelKey: "settings.sections.connections",
    items: [
      {
        id: "integrations",
        labelKey: "settings.nav.integrations",
        path: "/integrations",
        icon: Puzzle,
      },
      { id: "api", labelKey: "settings.nav.api", path: "/api", icon: KeyRound },
      {
        id: "data",
        labelKey: "settings.nav.data",
        path: "/data",
        icon: DatabaseBackup,
      },
    ],
  },
];

/**
 * The settings sidebar sections (settings spec 1.3). While the settings overview or the
 * instance config loads or fails, every item shows: each page has its own error state.
 */
export function settingsSections(
  workspaceId: string,
  modules?: Partial<Record<SettingsModule, boolean>>,
  billingEnabled?: boolean,
): readonly TeamNavSection[] {
  return sections.flatMap(({ items, ...section }) => {
    const shown = items.filter(
      (item) =>
        (!item.module || modules?.[item.module] !== false) &&
        (!item.billing || billingEnabled !== false),
    );
    return shown.length
      ? [
          {
            ...section,
            items: shown.map(({ id, labelKey, path, icon }) => ({
              id,
              labelKey,
              icon,
              to: teamHref(workspaceId, `/settings${path}`),
            })),
          },
        ]
      : [];
  });
}
