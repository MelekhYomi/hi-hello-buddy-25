import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pdf/$kind/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const kind = params.kind;
        const token = params.token;
        if (!["quote", "invoice", "receipt"].includes(kind)) {
          return new Response("Unknown document type", { status: 400 });
        }
        if (!/^[a-f0-9]{16,120}$/i.test(token)) {
          return new Response("Invalid link", { status: 400 });
        }
        const { buildDocumentPdf } = await import("@/lib/pdf.server");
        const doc = await buildDocumentPdf(kind as "quote" | "invoice" | "receipt", token);
        if (!doc) return new Response("Document not found", { status: 404 });
        return new Response(doc.bytes as unknown as BodyInit, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${doc.filename}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
