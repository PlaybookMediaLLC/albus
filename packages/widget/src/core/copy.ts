// The widget's own short labels, in the languages that Kaneo ships (i18n/*.json). A locale picks its
// exact entry, then its language, then English. shortcut: only the labels of #108 and #109 are here;
// move the widget's other text into this catalog as it gets translated.

type Copy = Record<string, string>;

const COPY = {
  /** The mark on a shipped roadmap request that the signed-in customer voted for (#109). */
  forYou: {
    az: "Sizin üçün",
    de: "Für Sie",
    el: "Για εσάς",
    en: "For you",
    es: "Para ti",
    fr: "Pour vous",
    hi: "आपके लिए",
    id: "Untuk Anda",
    it: "Per te",
    ja: "あなた向け",
    ko: "회원님을 위해",
    mk: "За вас",
    nl: "Voor jou",
    pl: "Dla Ciebie",
    pt: "Para você",
    ru: "Для вас",
    tr: "Sizin için",
    uk: "Для вас",
    vi: "Dành cho bạn",
    zh: "为您",
    "zh-tw": "為您",
  },
  /** The launcher bubble that announces a new changelog entry (#108); {title} is the entry's title. */
  newEntry: {
    az: "Yeni: {title}",
    de: "Neu: {title}",
    el: "Νέο: {title}",
    en: "New: {title}",
    es: "Nuevo: {title}",
    fr: "Nouveau : {title}",
    hi: "नया: {title}",
    id: "Baru: {title}",
    it: "Novità: {title}",
    ja: "新着: {title}",
    ko: "새 소식: {title}",
    mk: "Ново: {title}",
    nl: "Nieuw: {title}",
    pl: "Nowość: {title}",
    pt: "Novidade: {title}",
    ru: "Новое: {title}",
    tr: "Yeni: {title}",
    uk: "Нове: {title}",
    vi: "Mới: {title}",
    zh: "新动态：{title}",
    "zh-tw": "新動態：{title}",
  },
} satisfies Record<string, Copy>;

/** The label in `locale` (else the browser's language), with {title} filled in. */
export function widgetCopy(
  key: keyof typeof COPY,
  locale?: string,
  title = "",
) {
  const copy: Copy = COPY[key];
  const tag = (locale ?? globalThis.navigator?.language ?? "en")
    .toLowerCase()
    .replace("_", "-");
  // Chinese in Taiwan, Hong Kong and Macau reads traditional characters.
  const traditional = /^zh-(tw|hk|mo|hant)/.test(tag) ? "zh-tw" : undefined;
  const text =
    (traditional && copy[traditional]) ??
    copy[tag] ??
    copy[tag.split("-")[0]!] ??
    copy.en!;
  return text.replace("{title}", title);
}
