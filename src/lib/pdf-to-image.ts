// Renders the first page of a PDF to a PNG File, entirely in the browser,
// so PDF uploads (e.g. print-ready label/packaging designs) can be stored
// and displayed the same way as any other image — the rest of the site
// (portfolio grid, case study modal, etc.) only ever deals with <img>-able
// URLs and has no PDF-rendering path of its own.

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function pdfFileToImageFile(file: File, scale = 2.5): Promise<File> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // PDFs are transparent by default; flatten onto white so it matches the
  // rest of the (white-background) print deliverables in the portfolio.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PDF render failed"))), "image/png"),
  );

  const outName = file.name.replace(/\.pdf$/i, ".png");
  return new File([blob], outName, { type: "image/png" });
}
