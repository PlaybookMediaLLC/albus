import { TOKEN_VARIANTS, type TokenVariant } from "../variants.ts";
import { ANONYMOUS, USERS } from "../users.ts";

type Props = {
  user: string;
  onUser: (user: string) => void;
  variant: TokenVariant;
  onVariant: (variant: TokenVariant) => void;
  error?: string;
};

/** Fake sign-in. Each change signs a new identify token on the host server. */
export function SignIn({ user, onUser, variant, onVariant, error }: Props) {
  return (
    <fieldset>
      <legend>Host app sign-in</legend>
      <label>
        Signed in as{" "}
        <select
          data-testid="user"
          value={user}
          onChange={(event) => onUser(event.target.value)}
        >
          <option value={ANONYMOUS}>Anonymous</option>
          {USERS.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.name} ({candidate.sub})
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        Token{" "}
        <select
          data-testid="variant"
          value={variant}
          onChange={(event) => onVariant(event.target.value as TokenVariant)}
        >
          {TOKEN_VARIANTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" data-testid="sign-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
