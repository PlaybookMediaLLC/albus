interface SignInConfig {
  disableLoginForm: boolean;
  hasGoogleSignIn: boolean;
  hasGithubSignIn: boolean;
  hasDiscordSignIn: boolean;
  hasCustomOAuth: boolean;
  customOAuthName: string | null;
}

/** The sign-in methods of this instance, as translation keys or a provider name. */
export function signInMethods(config: SignInConfig): string[] {
  return [
    !config.disableLoginForm && "settings-product.login.methods.email",
    config.hasGoogleSignIn && "settings-product.login.methods.google",
    config.hasGithubSignIn && "settings-product.login.methods.github",
    config.hasDiscordSignIn && "settings-product.login.methods.discord",
    config.hasCustomOAuth &&
      (config.customOAuthName || "settings-product.login.methods.sso"),
  ].filter((method): method is string => Boolean(method));
}
