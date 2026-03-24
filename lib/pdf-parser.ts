const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 50_000; // ~12k tokens

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error("PDF trop volumineux. Taille maximale : 10 Mo");
  }

  // Dynamic import prevents webpack from bundling this Node.js-only module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfModule = (await import("pdf-parse")) as any;
  const pdfParse = pdfModule.default ?? pdfModule;
  const data = await pdfParse(buffer);

  const text = data.text.trim();
  if (!text || text.length < 100) {
    throw new Error(
      "Impossible d'extraire le texte de ce PDF. Vérifiez que le document n'est pas scanné ou protégé."
    );
  }

  // Truncate to avoid token overflow in GPT-4o
  return text.slice(0, MAX_TEXT_LENGTH);
}
