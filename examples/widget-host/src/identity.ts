import { createServerFn } from "@tanstack/react-start";
import { identityToken } from "./token.ts";
import { TOKEN_VARIANTS, type TokenVariant } from "./variants.ts";
import { USERS } from "./users.ts";

/** Signs the identify token on the server. The widget secret never leaves this process. */
export const signIdentity = createServerFn({ method: "POST" })
  .validator((input: { user: string; variant: TokenVariant }) => {
    if (!USERS.some((user) => user.key === input.user))
      throw new Error("Unknown user");
    if (!TOKEN_VARIANTS.includes(input.variant))
      throw new Error("Unknown token variant");
    return input;
  })
  .handler(({ data }) => {
    const secret = process.env.QUILLS_WIDGET_SECRET;
    if (!secret)
      throw new Error("Set QUILLS_WIDGET_SECRET in examples/widget-host/.env");
    const user = USERS.find((candidate) => candidate.key === data.user)!;
    return identityToken(user, data.variant, secret);
  });
