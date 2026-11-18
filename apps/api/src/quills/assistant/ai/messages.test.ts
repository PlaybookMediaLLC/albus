import { describe, expect, it } from "vite-plus/test";
import { toModelMessages } from "./messages";

describe("toModelMessages", () => {
  it("keeps the order and the system messages, and sends images as image files", () => {
    expect(
      toModelMessages([
        { role: "system", content: "rules" },
        { role: "system", content: "sources" },
        {
          role: "user",
          content: [
            { type: "text", text: "look" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,AA==" },
            },
          ],
        },
        { role: "assistant", content: "earlier answer" },
        { role: "user", content: "and now?" },
      ]),
    ).toEqual([
      { role: "system", content: "rules" },
      { role: "system", content: "sources" },
      {
        role: "user",
        content: [
          { type: "text", text: "look" },
          {
            type: "file",
            data: new URL("data:image/png;base64,AA=="),
            mediaType: "image/png",
          },
        ],
      },
      { role: "assistant", content: "earlier answer" },
      { role: "user", content: "and now?" },
    ]);
  });
});
