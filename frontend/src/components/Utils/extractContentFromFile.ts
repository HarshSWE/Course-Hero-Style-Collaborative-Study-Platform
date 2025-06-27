import { getDocument } from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { GlobalWorkerOptions } from "pdfjs-dist";

// Configure the PDF.js worker source for PDF parsing in a web environment
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Extracts text content from a given file URL.
 * Supports PDF files (using pdfjs-dist) and image files (using Tesseract OCR).
 *
 * @param fileURL - The URL of the file to extract text from.
 * @returns The extracted text as a string.
 */
export const extractContentFromFile = async (
  fileURL: string
): Promise<string> => {
  const filename = fileURL.split("/").pop() || "";

  if (filename.endsWith(".pdf")) {
    // Load the PDF document using pdfjs-dist
    const loadingTask = getDocument(fileURL);
    const pdf = await loadingTask.promise;

    let textContent = "";
    // Iterate through all pages to extract text
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContentItems = await page.getTextContent();
      // Combine all text items on the page into a single string
      const pageText = textContentItems.items
        .map((item: any) => item.str)
        .join(" ");
      textContent += pageText + "\n";
    }

    return textContent;
  } else if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
    // If file is an image, use Tesseract.js OCR to recognize text
    const result = await Tesseract.recognize(fileURL, "eng");
    return result.data.text;
  } else {
    return "Unsupported file type for text extraction.";
  }
};
