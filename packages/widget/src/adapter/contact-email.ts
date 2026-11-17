import { useEffect, useState } from "react";
import type { Api } from "./api.js";
import type { ContactEmail } from "../ui/types.js";

type State = {
  currentEmail: string | null;
  pendingEmail: string | null;
};

/**
 * An anonymous visitor's contact address for replies, read once for each session after the panel
 * opens with Messages on. A code mailed to the address sets it; `onConfirmed` tells the SDK.
 */
export function useWidgetContactEmail(
  api: Api,
  session: number | null,
  identified: boolean,
  active: boolean,
  messenger: boolean,
  onConfirmed: (email: string) => void,
) {
  const [found, setFound] = useState<{
    session: number;
    contact: ContactEmail;
  } | null>(null);
  useEffect(() => {
    if (session === null || identified || !active || !messenger) return;
    const controller = new AbortController();
    api
      .request<State>(
        "GET",
        "/widget/contact-email",
        undefined,
        controller.signal,
      )
      .then((result) =>
        setFound({
          session,
          contact: {
            email: result.currentEmail,
            pendingEmail: result.pendingEmail,
          },
        }),
      )
      .catch(() => {});
    return () => controller.abort();
  }, [api, session, identified, active, messenger]);
  const contact = found?.session === session ? found.contact : null;
  if (!contact || identified) return {};
  const set = (next: ContactEmail) =>
    setFound((value) =>
      value?.session === session ? { session, contact: next } : value,
    );
  return {
    contactEmail: contact,
    onRequestContactEmail: async (email: string) => {
      const result = await api.request<{ ok: boolean; reason: string | null }>(
        "POST",
        "/widget/contact-email",
        { email },
      );
      if (!result.ok) throw new Error(result.reason ?? "Not requested");
      set({ ...contact, pendingEmail: email.toLowerCase() });
    },
    onConfirmContactEmail: async (email: string, code: string) => {
      const result = await api.request<{ ok: boolean; email: string | null }>(
        "POST",
        "/widget/contact-email/confirm",
        { email, code },
      );
      if (!result.ok || !result.email) throw new Error("Invalid code");
      set({ email: result.email, pendingEmail: null });
      onConfirmed(result.email);
    },
  };
}
