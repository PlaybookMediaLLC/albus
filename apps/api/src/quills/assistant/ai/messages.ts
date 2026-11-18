// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { ModelMessage } from "ai";
import type { ContentPart, Message } from "./types";

// Quills code writes chat messages in the OpenAI shape it always used; these become AI SDK messages
// in the same order, so the request on the wire stays the same. System messages stay in place.

const part = (item: ContentPart) =>
  item.type === "text"
    ? { type: "text" as const, text: item.text }
    : {
        type: "file" as const,
        data: new URL(item.image_url.url),
        // A data URL names its type; a link is some image.
        mediaType: /^data:([^;,]+)/.exec(item.image_url.url)?.[1] ?? "image/*",
      };

export const toModelMessages = (messages: Message[]): ModelMessage[] =>
  messages.map((message): ModelMessage =>
    message.role === "user" && typeof message.content !== "string"
      ? { role: "user", content: message.content.map(part) }
      : (message as ModelMessage),
  );
