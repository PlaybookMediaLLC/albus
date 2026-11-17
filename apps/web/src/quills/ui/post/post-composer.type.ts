import type { RawFieldValue } from "../../core/composer-fields";

export interface PostComposerValues {
  boardId?: string;
  title: string;
  content: string;
  /** The chosen board's custom field inputs, as typed (see core/composer-fields). */
  customFields?: Record<string, RawFieldValue>;
}
