import { eq } from "drizzle-orm";
import { withQuillsSystemWorkspace } from "../../../database/quills/client";
import { assistantWebSources } from "../../../database/quills/schema/assistant-web-sources";
import { createGuardedFetch } from "../../../import/guarded-fetch";
import { recordQuillsChange } from "../../events";
import { MAX_SOURCES } from "../web-sources";
import { nothing, type Work } from "./shared";

// assistant_web_source.added: fetches the page through Kaneo's public-destination guard (every
// redirect and the socket's DNS answer are checked) and stores its text. A failure leaves the
// content empty and moves fetched_at, which the list shows as `failed`. It is not retried.
// With `crawl`, the page's links under its own folder become sources too (one level, at most
// MAX_CRAWL, within the workspace limit); each is fetched by its own job through the same guard.
// assistant_web_source.updated with `refresh` fetches the page again and keeps its old text on a
// failure.

const MAX_BYTES = 1_000_000;
const MAX_TEXT = 50_000;
const TIMEOUT_MS = 10_000;
const MAX_CRAWL = 20;
const NOT_PAGES =
  /\.(css|js|mjs|json|xml|rss|png|jpe?g|gif|svg|webp|ico|pdf|zip|woff2?|mp4|mp3)$/i;

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};
const decode = (text: string) =>
  text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (all, code: string) => {
    if (code[0] !== "#") return entities[code.toLowerCase()] ?? all;
    const point = Number.parseInt(
      code.slice(code[1] === "x" ? 2 : 1),
      code[1] === "x" ? 16 : 10,
    );
    return Number.isFinite(point) && point > 0 && point < 0x110000
      ? String.fromCodePoint(point)
      : all;
  });

/** The title and readable text of an HTML or plain-text page. */
export function pageText(raw: string, html: boolean) {
  // PostgreSQL text cannot hold NUL; a page with one would fail its write on every refresh.
  const body = raw.replaceAll("\u0000", "");
  if (!html) return { title: null, text: body.replace(/\s+/g, " ").trim() };
  const title = /<title[^<>]*>([^<]*)/i.exec(body)?.[1];
  const text = body
    // Linear patterns: a hostile page must not hold the event loop.
    .replace(/<(script|style|noscript|svg|head)\b[\s\S]*?(?:<\/\1>|$)/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^<>]*>/g, " ");
  return {
    title: title ? decode(title).replace(/\s+/g, " ").trim() || null : null,
    text: decode(text)
      .replace(/[^\S\n]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .trim(),
  };
}

/**
 * The page's links in its own folder (same origin, a path under the page's folder), without
 * fragment or query, in page order. A linear pattern: a hostile page must not hold the event loop.
 */
export function linksOf(body: string, base: string) {
  const root = new URL(".", base);
  const self = new URL(base).href;
  const found = new Set<string>();
  for (const [, href] of body.matchAll(
    /href\s*=\s*["']([^"'<>\s]{1,2000})["']/gi,
  )) {
    if (!URL.canParse(href!, base)) continue;
    const url = new URL(href!, base);
    url.hash = "";
    url.search = "";
    if (
      // The origin leaves out user and password; the add route refuses them, so does a crawl.
      !url.username &&
      !url.password &&
      url.origin === root.origin &&
      url.pathname.startsWith(root.pathname) &&
      !NOT_PAGES.test(url.pathname) &&
      url.href !== self
    )
      found.add(url.href);
    if (found.size >= MAX_CRAWL) break;
  }
  return [...found];
}

async function readLimited(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) break;
      chunks.push(value);
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchPage(url: string, crawl: boolean) {
  const guard = createGuardedFetch("Web source");
  try {
    const response = await guard.fetch(url, {
      headers: { accept: "text/html, text/plain;q=0.9" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = response.headers.get("content-type") ?? "";
    const html = /text\/html|application\/xhtml/i.test(type);
    if (!response.ok || (!html && !/text\/plain/i.test(type))) {
      void response.body?.cancel().catch(() => {});
      return null;
    }
    const body = await readLimited(response);
    const page = pageText(body, html);
    return page.text
      ? {
          ...page,
          // Relative links resolve against the page after its redirects.
          links: crawl && html ? linksOf(body, response.url || url) : [],
        }
      : null;
  } catch {
    // Destination refusals, timeouts and network errors all leave the source failed.
    return null;
  }
}

export const fetchWebSource: Work = async (workspaceId, event) => {
  const [source] = await withQuillsSystemWorkspace(workspaceId, (db) =>
    db
      .select({ id: assistantWebSources.id, url: assistantWebSources.url })
      .from(assistantWebSources)
      .where(eq(assistantWebSources.id, event.entityId as never)),
  );
  if (!source) return nothing;
  const payload = (event.payload ?? {}) as Record<string, string>;
  const refresh = event.type === "assistant_web_source.updated";
  if (refresh && payload.refresh !== "true") return nothing;
  const crawl = !refresh && payload.crawl === "true";
  const page = await fetchPage(source.url, crawl);
  return async (db) => {
    const [row] = await db
      .update(assistantWebSources)
      .set({
        // A failed refresh keeps the time of the last successful fetch.
        ...((page || !refresh) && { fetchedAt: new Date() }),
        updatedAt: new Date(),
        ...(page && {
          content: page.text.slice(0, MAX_TEXT),
          ...(page.title && { title: page.title.slice(0, 200) }),
        }),
      })
      .where(eq(assistantWebSources.id, source.id))
      .returning({ id: assistantWebSources.id });
    if (row)
      await recordQuillsChange(db, null, {
        type: "assistant_web_source.fetched",
        entityType: "assistant_web_source",
        entityId: row.id,
        payload: { status: page ? "ready" : "failed" },
      });
    if (!row || !crawl || !page?.links.length) return;
    const total = await db.$count(assistantWebSources);
    const links = page.links.slice(
      0,
      Math.max(0, Math.min(MAX_CRAWL, MAX_SOURCES - total)),
    );
    if (!links.length) return;
    const now = new Date();
    const added = await db
      .insert(assistantWebSources)
      .values(
        links.map((url) => ({
          url,
          title: new URL(url).hostname,
          content: "",
          fetchedAt: now,
          createdAt: now,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: assistantWebSources.id });
    for (const child of added)
      await recordQuillsChange(db, null, {
        type: "assistant_web_source.added",
        entityType: "assistant_web_source",
        entityId: child.id,
      });
  };
};
