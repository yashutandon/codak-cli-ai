import { readFileSync, existsSync } from "fs";
import { extname } from "path";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const PATH_REGEX = /(?:[A-Za-z]:\\[^\s"']+|\/[^\s"']+)\.(?:png|jpg|jpeg|webp|gif)/gi;

function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    default: return "application/octet-stream";
  }
}

export function parseImagesFromText(text: string): { processedText: string; images: string[] } {
  let processedText = text;
  const images: string[] = [];
  const matches = text.match(PATH_REGEX) || [];

  for (const match of matches) {
    try {
      if (existsSync(match)) {
        const ext = extname(match);
        const mime = getMimeType(ext);
        const base64 = readFileSync(match).toString("base64");
        images.push(`data:${mime};base64,${base64}`);
        
        // Remove the path from the text so we don't confuse the model with local file paths
        processedText = processedText.replace(match, "").trim();
      }
    } catch (e) {
      console.error(`Failed to read image ${match}:`, e);
    }
  }

  return { processedText, images };
}
