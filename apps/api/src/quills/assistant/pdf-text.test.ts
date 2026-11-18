import { describe, expect, it } from "vite-plus/test";
import { samplePdf } from "./pdf.fixture";
import { PdfError, pdfText } from "./pdf-text";

describe("pdfText", () => {
  it("reads the text layer of a PDF", async () => {
    expect(await pdfText(samplePdf("Refunds take 5 business days."))).toBe(
      "Refunds take 5 business days.",
    );
  });

  it("reads a Node Buffer, as storage returns it", async () => {
    expect(await pdfText(Buffer.from(samplePdf("From storage.")))).toBe(
      "From storage.",
    );
  });

  it("refuses a file that is not a PDF", async () => {
    await expect(
      pdfText(new TextEncoder().encode("not a pdf")),
    ).rejects.toBeInstanceOf(PdfError);
  });
});
