import { createHash } from "node:crypto";
import { quillsStorageConfig } from "../../storage/s3";

/** The version part of an avatar URL: it changes with the stored key, so caches never go stale. */
const version = (key: string) =>
  createHash("sha256").update(key).digest("hex").slice(0, 12);

/**
 * The stable URL of an uploaded customer avatar, stored on the principal so every list that
 * shows people shows it without signing a URL per row. With QUILLS_STORAGE_PUBLIC_BASE_URL (an R2
 * public or custom domain) it is the object itself; else the avatar route of avatar-image.ts,
 * which redirects to a short-lived signed URL. Absolute when KANEO_API_URL is set, so a web app
 * hosted apart from the API loads it too.
 */
export function customerAvatarUrl(
  workspaceId: string,
  principalId: string,
  key: string,
) {
  const publicBase = quillsStorageConfig().publicBaseUrl?.replace(/\/+$/, "");
  if (publicBase) return `${publicBase}/${key}`;
  const api = (process.env.KANEO_API_URL ?? "").replace(/\/+$/, "");
  return `${api}/api/quills-public/${encodeURIComponent(workspaceId)}/avatars/${principalId}?v=${version(key)}`;
}

/** Types a customer avatar may have: what every browser shows. No SVG, which can carry script. */
export const avatarContentTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

/** A customer avatar's size limit. The apps send a 256 px square, far below it. */
export const MAX_CUSTOMER_AVATAR_BYTES = 1024 * 1024;
