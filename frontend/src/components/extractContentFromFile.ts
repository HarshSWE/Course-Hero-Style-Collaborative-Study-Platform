import { getDocument } from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export const extractContentFromFile = async (
  fileURL: string
): Promise<string> => {
  const filename = fileURL.split("/").pop() || "";

  if (filename.endsWith(".pdf")) {
    const loadingTask = getDocument(fileURL);
    const pdf = await loadingTask.promise;

    let textContent = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContentItems = await page.getTextContent();
      const pageText = textContentItems.items
        .map((item: any) => item.str)
        .join(" ");
      textContent += pageText + "\n";
    }

    return textContent;
  } else if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
    const result = await Tesseract.recognize(fileURL, "eng");
    return result.data.text;
  } else {
    return "Unsupported file type for text extraction.";
  }
};
