import { useState } from "react";

/** A starred view: its address (path and search) and the title it had when starred. */
export interface Favorite {
  path: string;
  label: string;
}

const key = (workspaceId: string) => `quills.favorites.${workspaceId}`;

/** The starred views of a workspace on this browser. A blocked or broken storage reads as none. */
export function readFavorites(workspaceId: string): Favorite[] {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(key(workspaceId)) ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter(
          (item): item is Favorite =>
            typeof item?.path === "string" && typeof item?.label === "string",
        )
      : [];
  } catch {
    return [];
  }
}

/** The starred views of a workspace on this browser, and a toggle for one view. */
export function useFavorites(workspaceId: string) {
  const [favorites, setFavorites] = useState(() => readFavorites(workspaceId));
  const toggle = (path: string, label: string) => {
    const next = favorites.some((item) => item.path === path)
      ? favorites.filter((item) => item.path !== path)
      : [...favorites, { path, label }];
    setFavorites(next);
    try {
      window.localStorage.setItem(key(workspaceId), JSON.stringify(next));
    } catch {
      // shortcut: a blocked storage keeps the stars for this page only.
    }
  };
  return [favorites, toggle] as const;
}
