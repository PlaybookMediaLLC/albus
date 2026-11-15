/** The API limits of a changelog entry. */
export const TITLE_MAX = 200;
export const CONTENT_MAX = 100_000;

/**
 * The autosave body for the title and the content, or null when nothing can be saved yet.
 * The API needs a title, and a new entry needs content too. Empty content is left out of an
 * update, because the API refuses it.
 */
export function saveBody(title: string, content: string, isNew: boolean) {
  const name = title.trim().slice(0, TITLE_MAX);
  const hasContent = content.trim().length > 0;
  if (!name || (isNew && !hasContent)) return null;
  return {
    title: name,
    ...(hasContent && { content: content.slice(0, CONTENT_MAX) }),
  };
}
