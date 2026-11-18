/** A prepared avatar (base64 data and type, from Kaneo's prepareAvatarImage) as a file to upload. */
export function avatarFile(prepared: { contentType: string; data: string }) {
  const bytes = Uint8Array.from(atob(prepared.data), (char) =>
    char.charCodeAt(0),
  );
  const extension = prepared.contentType === "image/png" ? "png" : "webp";
  return new File([bytes], `avatar.${extension}`, {
    type: prepared.contentType,
  });
}
