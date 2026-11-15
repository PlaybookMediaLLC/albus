import { useState } from "react";

const key = (workspaceId: string) => `quills.roadmap-collapsed.${workspaceId}`;

/** The collapsed roadmap columns of a workspace on this device. A blocked storage reads as none. */
export function readCollapsed(workspaceId: string): string[] {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(key(workspaceId)) ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeCollapsed(workspaceId: string, ids: readonly string[]) {
  try {
    window.localStorage.setItem(key(workspaceId), JSON.stringify(ids));
  } catch {
    // ponytail: a blocked storage keeps the columns collapsed for this page only.
  }
}

/** The collapsed columns of a workspace, kept on this device, and a toggle for one column. */
export function useCollapsedColumns(workspaceId: string) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(workspaceId));
  const toggle = (statusId: string) => {
    const next = collapsed.includes(statusId)
      ? collapsed.filter((id) => id !== statusId)
      : [...collapsed, statusId];
    setCollapsed(next);
    writeCollapsed(workspaceId, next);
  };
  return [collapsed, toggle] as const;
}
