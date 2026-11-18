import { createContext } from "react";

/**
 * What the team shell gives a page header: the section for the breadcrumb, and whether the
 * current view is starred. Null outside the app section of the shell, such as in settings.
 */
export interface TeamHeader {
  section: string;
  favorite: boolean;
  /** Stars or unstars the current view under this title. */
  onFavorite: (title: string) => void;
}

export const TeamHeaderContext = createContext<TeamHeader | null>(null);
