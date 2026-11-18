import { empty, fixture } from "../framework/contract";
import { createUpload } from "../framework/files";
import { on } from "./seed.fixture";

export const listQuillsAssistantDocuments = empty;
export const uploadQuillsAssistantDocument = fixture({
  seed: async () => ({}),
  valid: () => ({
    body: {
      title: "Returns",
      fileName: "returns.md",
      mimeType: "text/markdown",
      content: "# Returns\nWithin 30 days.",
    },
  }),
});
const pdf = { contentType: "application/pdf", size: 1024 };
const pdfUpload = async (workspaceId: string) =>
  (
    await createUpload(workspaceId, {
      purpose: "file",
      filename: "returns.pdf",
      ...pdf,
    })
  ).key;
export const uploadQuillsAssistantPdfDocument = fixture({
  seed: async (env) => ({
    a: await pdfUpload(env.a),
    b: await pdfUpload(env.b),
  }),
  valid: ({ a }) => ({
    body: {
      title: "Returns",
      fileName: "returns.pdf",
      key: a,
      ...pdf,
    },
  }),
  foreign: ({ b }) => ({ key: b }),
});
export const deleteQuillsAssistantDocument = on(
  ["document"],
  (a) => ({ params: { documentId: a.documentId } }),
  (b) => ({ documentId: b.documentId }),
);
