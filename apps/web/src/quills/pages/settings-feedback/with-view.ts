const rank = { anonymous: 0, authenticated: 1, segments: 2, team: 3 } as const;
export type AccessTier = keyof typeof rank;

interface Access {
  view: AccessTier;
  vote: AccessTier;
  comment: AccessTier;
  submit: AccessTier;
}

/**
 * The full board access with a new view tier. The API refuses an action that is more open
 * than view, so a stricter view also makes each more open action as strict as view.
 */
export function withView<A extends Access>(access: A, view: AccessTier): A {
  const atLeast = (tier: AccessTier) => (rank[tier] < rank[view] ? view : tier);
  return {
    ...access,
    view,
    vote: atLeast(access.vote),
    comment: atLeast(access.comment),
    submit: atLeast(access.submit),
  };
}
