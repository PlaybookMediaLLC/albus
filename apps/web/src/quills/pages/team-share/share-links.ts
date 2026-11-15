import { portalHref } from "../../core/portal-href";

interface Domain {
  kind: string;
  domain: string;
  active: boolean;
}

/** The public portal URL: the active custom portal domain, else the portal path on this origin. */
export function portalUrl(
  workspaceId: string,
  origin: string,
  domains: readonly Domain[] = [],
) {
  const custom = domains.find((item) => item.kind === "portal" && item.active);
  return custom
    ? `https://${custom.domain}`
    : new URL(portalHref(workspaceId), origin).href;
}

export type SiteArea = "feedback" | "roadmap" | "changelog";

/**
 * The portal areas that customers can open: the module is on, and the portal navigation
 * does not hide the area. An empty navigation is the default, which shows every area.
 */
export function siteLinks(
  base: string,
  modules: { feedback: boolean; changelog: boolean },
  nav: readonly { type: string; enabled: boolean }[] = [],
): { area: SiteArea; url: string }[] {
  const root = base.replace(/\/+$/, "");
  const areas: [SiteArea, boolean, string][] = [
    ["feedback", modules.feedback, root],
    ["roadmap", modules.feedback, `${root}/roadmap`],
    ["changelog", modules.changelog, `${root}/changelog`],
  ];
  return areas
    .filter(
      ([area, on]) =>
        on && nav.find((item) => item.type === area)?.enabled !== false,
    )
    .map(([area, , url]) => ({ area, url }));
}

export type Network = "x" | "linkedin" | "facebook" | "reddit";

/** The share URL of each network for the portal URL and a short text. */
export function socialLinks(
  url: string,
  text: string,
): Record<Network, string> {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return {
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
  };
}

/** The script-tag embed of the widget (packages/widget/README.md), in three steps. */
export function widgetSnippets(apiBase: string, workspace: string) {
  const sdk = `${apiBase.replace(/\/+$/, "")}/quills-public/${encodeURIComponent(workspace)}/widget/sdk.js`;
  return {
    load: [
      "<script>window.Quills=window.Quills||function(){(window.Quills.q=window.Quills.q||[]).push(arguments)};</script>",
      `<script src="${sdk}" defer></script>`,
    ].join("\n"),
    start: [
      "<script>",
      '  Quills("init", { placement: "right" });',
      "</script>",
    ].join("\n"),
    identify: [
      "<script>",
      '  Quills("identify", { ssoToken: "TOKEN_FROM_YOUR_SERVER" });',
      "</script>",
    ].join("\n"),
  };
}
