const known: Record<string, string> = {
  credential: "settings-workspace.account.methods.password",
  google: "settings-workspace.account.methods.google",
  github: "settings-workspace.account.methods.github",
  discord: "settings-workspace.account.methods.discord",
};

/**
 * The names of the sign-in providers that are linked to an account. The "custom" provider
 * has the name that the instance sets. A person without a linked provider signs in with an
 * email link or code.
 */
export function signInMethods(
  providerIds: readonly string[],
  t: (key: string) => string,
  customName?: string | null,
): string[] {
  if (!providerIds.length)
    return [t("settings-workspace.account.methods.email")];
  return [...new Set(providerIds)].map((id) => {
    if (id === "custom")
      return customName || t("settings-workspace.account.methods.sso");
    const key = known[id];
    return key ? t(key) : id;
  });
}
