// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { extractText, getDocumentProxy } from "unpdf";

// The text of an uploaded PDF, for a knowledge document. Only text layers are read: a scanned PDF
// (images only) has no text, and the caller refuses it.

/** A PDF larger than this is refused before parsing. */
// ponytail: the parse runs on the request's thread (unpdf's PDF.js build has no worker), so these
// caps bound how long it holds the event loop; move the parse to a worker thread for larger files.
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 200;

export class PdfError extends Error {}

/** The PDF's text with whitespace collapsed per line, or a PdfError for an unreadable file. */
export async function pdfText(bytes: Uint8Array) {
  let pdf;
  try {
    // The bundled PDF.js has no eval path for font programs (CVE-2024-4367): no option needed.
    // PDF.js refuses a Node Buffer; a plain copy also keeps the caller's bytes intact.
    pdf = await getDocumentProxy(new Uint8Array(bytes));
  } catch {
    throw new PdfError("This file is not a readable PDF");
  }
  try {
    if (pdf.numPages > MAX_PAGES)
      throw new PdfError(`A PDF can have at most ${MAX_PAGES} pages`);
    const { text } = await extractText(pdf, { mergePages: true });
    return (
      text
        // PostgreSQL text cannot hold NUL, which a font's character map can produce.
        .replaceAll("\u0000", "")
        .replace(/[^\S\n]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim()
    );
  } finally {
    await pdf.loadingTask.destroy();
  }
}
