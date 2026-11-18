import { useState } from "react";

const key = (workspaceId: string) => `quills.get-started-hidden.${workspaceId}`;

/** Whether this browser hid the team home's get-started cards. A blocked storage reads as shown. */
export function readHidden(workspaceId: string): boolean {
  try {
    return window.localStorage.getItem(key(workspaceId)) === "1";
  } catch {
    return false;
  }
}

/** The hidden state of the get-started cards on this browser, and a way to hide them. */
export function useGetStartedHidden(workspaceId: string) {
  const [hidden, setHidden] = useState(() => readHidden(workspaceId));
  const hide = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(key(workspaceId), "1");
    } catch {
      // shortcut: a blocked storage hides the cards for this page only.
    }
  };
  return [hidden, hide] as const;
}
