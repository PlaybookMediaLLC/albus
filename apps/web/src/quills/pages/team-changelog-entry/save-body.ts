/** The API limits of a changelog entry. */
export const TITLE_MAX = 200;
export const CONTENT_MAX = 100_000;

/** The field that a save still needs: the API needs a title, and a new entry needs content. */
export function missingField(
  title: string,
  content: string,
  isNew: boolean,
): "title" | "content" | null {
  if (!title.trim()) return "title";
  return isNew && !content.trim() ? "content" : null;
}

/**
 * The autosave body for the title and the content, or null when nothing can be saved yet.
 * Empty content is left out of an update, because the API refuses it.
 */
export function saveBody(title: string, content: string, isNew: boolean) {
  if (missingField(title, content, isNew)) return null;
  const hasContent = content.trim().length > 0;
  return {
    title: title.trim().slice(0, TITLE_MAX),
    ...(hasContent && { content: content.slice(0, CONTENT_MAX) }),
  };
}
