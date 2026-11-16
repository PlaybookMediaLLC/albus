// Class tokens that the CSS polish plan removed (docs/quills-port/css-polish-plan.md).
const checks = [
  [
    (token) => /(?:^|:)text-\[\d+(?:\.\d+)?px\]$/.test(token),
    "Use a Tailwind text step, not a px size.",
  ],
  [
    (token) =>
      /(?:^|:)(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide)-(?:(?:neutral|zinc|gray|slate|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|white|black)(?:\/\d+)?$/.test(
        token,
      ),
    "Use a semantic theme token, not a palette color.",
  ],
  [
    (token) => /^(?:[\w-]+:)*prose(?:-[\w-]+)?$/.test(token),
    "The typography plugin is not installed; style Markdown in MarkdownContent.",
  ],
  [
    (token) =>
      /(?:^|:)before:hidden$/.test(token) ||
      /(?:^|:)sm:(?:h|min-h|size)-/.test(token),
    "Use a Button or Select size instead of overriding it.",
  ],
];

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
        const failed = checks.find(([test]) => test(token));
        if (failed) report("C24", d, node, `${failed[1]} (${token})`);
      }
    }
  }
}
