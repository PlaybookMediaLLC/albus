import Quills from "../index.js";

/**
 * Returns the Quills singleton. Equivalent to importing it directly —
 * exists for React-idiomatic usage.
 */
export function useQuills(): typeof Quills {
  return Quills;
}
