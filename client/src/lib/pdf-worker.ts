import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
// Use the non-module worker to avoid MIME/content-type issues in some browsers
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_URL;
}

export { pdfjsLib };
export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

