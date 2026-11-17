import type { MessageKey } from "./messages/en.js";
import type { Message } from "./translate.js";

/** A language's messages; a missing one shows the English source. */
export type Catalog = Partial<Record<MessageKey, Message>>;
