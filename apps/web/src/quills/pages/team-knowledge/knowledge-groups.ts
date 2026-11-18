import type { KnowledgeSuggestion } from "./parts/knowledge-row";

/** The list groups: what the customer agent could not answer first, then the rest; no empty group. */
export function knowledgeGroups(
  items: readonly KnowledgeSuggestion[],
  labels: { gaps: string; others: string },
) {
  return [
    { id: "gaps", label: labels.gaps, items: items.filter((item) => item.gap) },
    {
      id: "others",
      label: labels.others,
      items: items.filter((item) => !item.gap),
    },
  ].filter((group) => group.items.length);
}
