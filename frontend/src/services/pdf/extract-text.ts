// pdfjs-dist touches browser-only globals (DOMMatrix, etc.) at import time,
// which breaks Next.js's server-side prerendering if imported at module
// scope. Lazy-import it inside the function so it only ever loads in the
// browser, when extractTextFromPdf() is actually called from a click handler.
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n").trim();
  if (!text) {
    throw new Error("Couldn't extract any text from this PDF — it may be a scanned image without a text layer.");
  }
  return text;
}
