/**
 * A stable key for a topic: the same words in any order, case or punctuation give the same key.
 * The API stores it with a unique index over open suggestions, so two jobs cannot open the same
 * topic twice. The semantic match (embeddings and the judge) catches reworded topics.
 */
const STOPWORDS = new Set(
  "a an and are as at be by can do does for from how i in is it my of on or our the this to we what when where which who why with you your".split(
    " ",
  ),
);

/** FNV-1a over the normalized words, two seeds, 16 hex characters. */
export function topicFingerprint(topic: string): string {
  const all = topic.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const words = all.filter((word) => !STOPWORDS.has(word));
  // A topic of stopwords only keeps them, so such topics do not all share one key.
  const text = [...new Set(words.length ? words : all)].sort().join(" ");
  const hash = (seed: number) => {
    let h = seed;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  };
  return `${hash(0x811c9dc5)}${hash(0x01000193)}`;
}
