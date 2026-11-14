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

/** An item: its ID, label, path after /settings and icon, and when it shows. */
type Row = [
  id: string,
  labelKey: string,
  path: string,
  icon: LucideIcon,
  gate?: SettingsModule | "billing",
];

const sections: readonly [id: string, labelKey: string, rows: Row[]][] = [
  [
    "personal",
    "settings.sections.personal",
    [["account", "settings.nav.account", "/account", CircleUserRound]],
  ],
  [
    "workspace",
    "settings.sections.workspace",
    [
      ["branding", "settings.nav.branding", "/branding", Palette],
      [
        "languages",
        "settings.nav.languages",
        "/languages",
        Languages,
        "helpCenter",
      ],
      ["domain", "settings.nav.domain", "/domain", Globe],
      ["team", "settings.nav.team", "/team", Users],
      ["billing", "settings.nav.billing", "/billing", CreditCard, "billing"],
    ],
  ],
  [
    "product",
    "settings.sections.product",
    [
      [
        "feedback",
        "settings.nav.feedback",
        "/feedback",
        MessageSquare,
        "feedback",
      ],
      [
        "changelog",
        "settings.nav.changelog",
        "/changelog",
        Megaphone,
        "changelog",
      ],
      ["privacy", "settings.nav.privacy", "/privacy", Shield],
      ["login", "settings.nav.login", "/login", Lock],
    ],
  ],
  [
    "conversations",
    "settings.sections.conversations",
    [
      [
        "general",
        "settings.nav.general",
        "/conversations/general",
        MessagesSquare,
        "supportInbox",
      ],
      [
        "operators",
        "settings.nav.operators",
        "/conversations/operators",
        Headset,
        "supportInbox",
      ],
      [
        "topics",
        "settings.nav.topics",
        "/conversations/topics",
        Tag,
        "supportInbox",
      ],
      [
        "email",
        "settings.nav.email",
        "/conversations/email",
        Mail,
        "supportInbox",
      ],
      ["widget", "settings.nav.widget", "/conversations/widget", AppWindow],
      ["ai", "settings.nav.ai", "/conversations/ai", Sparkles, "supportInbox"],
      [
        "moderation",
        "settings.nav.moderation",
        "/conversations/moderation",
        ShieldCheck,
      ],
    ],
  ],
  [
    "connections",
    "settings.sections.connections",
    [
      ["integrations", "settings.nav.integrations", "/integrations", Puzzle],
      ["api", "settings.nav.api", "/api", KeyRound],
      ["data", "settings.nav.data", "/data", DatabaseBackup],
    ],
  ],
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
  return sections.map(([id, labelKey, rows]) => ({
    id,
    labelKey,
    // Each section keeps at least one item that is always shown.
    items: rows
      .filter(
        ([, , , , gate]) =>
          !gate ||
          (gate === "billing"
            ? billingEnabled !== false
            : modules?.[gate] !== false),
      )
      .map(([item, itemLabel, path, icon]) => ({
        id: item,
        labelKey: itemLabel,
        icon,
        to: teamHref(workspaceId, `/settings${path}`),
      })),
  }));
}
