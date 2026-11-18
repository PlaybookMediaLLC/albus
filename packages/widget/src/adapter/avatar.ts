import { ApiError, type Api } from "./api.js";

/** The size of the square that the widget uploads as a visitor's picture. */
export const AVATAR_SIZE = 256;

/** Crops the image to its centred square and re-encodes it at 256 px, so uploads stay small. */
export async function squareAvatar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context || !side) throw new ApiError(0, "Could not read the image.");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new ApiError(0, "Could not read the image.");
  return new File([blob], "avatar.webp", { type: blob.type || "image/webp" });
}

/**
 * Uploads a prepared picture to the visitor's own key and saves it as their avatar. Needs a
 * visitor that the host app identified. Returns the picture's URL.
 */
export async function uploadAvatar(
  api: Api,
  file: File,
): Promise<string | null> {
  const object = { contentType: file.type, size: file.size };
  const target = await api.request<{
    key: string;
    uploadUrl: string;
    headers: Record<string, string>;
  }>("POST", "/widget/uploads", {
    purpose: "customer_avatar",
    filename: file.name,
    ...object,
  });
  let stored: Response;
  try {
    stored = await fetch(target.uploadUrl, {
      method: "PUT",
      headers: target.headers,
      body: file,
      // Storage gets no cookie and no session token.
      credentials: "omit",
    });
  } catch {
    throw new ApiError(0, "Could not upload the image. Check your connection.");
  }
  if (!stored.ok)
    throw new ApiError(stored.status, "Could not upload the image.");
  const saved = await api.request<{ avatarUrl: string | null }>(
    "PUT",
    "/widget/avatar",
    { key: target.key, ...object },
  );
  return saved.avatarUrl;
}

/** Removes the visitor's uploaded picture; a picture that the host app sent stays. */
export async function removeAvatar(api: Api): Promise<string | null> {
  const removed = await api.request<{ avatarUrl: string | null }>(
    "DELETE",
    "/widget/avatar",
  );
  return removed.avatarUrl;
}
