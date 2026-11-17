import { useQuillsInit } from "@quills/widget/react";
import { INSTANCE_URL, WORKSPACE } from "../config.ts";
import { initFields, type HostInit } from "./InitOptions.tsx";

/** The npm embed. Its parent keys it by the init options, so a change re-initializes. */
export function ReactWidget({
  init,
  token,
}: {
  init: HostInit;
  token?: string;
}) {
  useQuillsInit({
    instanceUrl: INSTANCE_URL,
    workspace: WORKSPACE,
    ...initFields(init),
    identity: token ? { ssoToken: token } : undefined,
  });
  return null;
}
