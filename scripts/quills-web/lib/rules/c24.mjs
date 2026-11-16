// Class tokens that the CSS polish plan removed (docs/quills-port/css-polish-plan.md). A token
// may carry variants ("dark:"), the important mark ("!text-..." or "text-...!") and an opacity.
const shape = (core) =>
  new RegExp(`^(?:[\\w-]+:)*!?(?:${core})(?:\\/\\d+)?!?$`);
const palette =
  "neutral|zinc|gray|slate|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const checks = [
  [
    shape("text-\\[\\d+(?:\\.\\d+)?px\\]"),
    "Use a Tailwind text step, not a px size.",
  ],
  [
    shape(
      `(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide)-(?:(?:${palette})-\\d{2,3}|white|black)`,
    ),
    "Use a semantic theme token, not a palette color.",
  ],
  [
    shape("prose(?:-[\\w-]+)?"),
    "The typography plugin is not installed; style Markdown in MarkdownContent.",
  ],
  [
    shape("before:hidden"),
    "Use a Button or Select size instead of hiding its edge.",
  ],
];

/** The C24 message for a class token, or undefined for an allowed token. */
export function bannedClass(token) {
  return checks.find(([pattern]) => pattern.test(token))?.[1];
}

const textOf = (node) =>
  ["Literal", "StringLiteral"].includes(node.type) &&
  typeof node.value === "string"
    ? node.value
    : node.type === "TemplateElement"
      ? node.value?.cooked
      : undefined;

export function check({ documents, report }) {
  for (const d of documents) {
    if (!d.file.endsWith(".tsx") || d.kind === "test") continue;
    for (const { node } of d.nodes) {
      const text = textOf(node);
      if (typeof text !== "string") continue;
      for (const token of text.split(/\s+/)) {
        const message = bannedClass(token);
        if (message) report("C24", d, node, `${message} (${token})`);
      }
    }
  }
}
