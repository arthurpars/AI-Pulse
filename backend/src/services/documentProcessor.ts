import { prisma } from "../lib/prisma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse";
import { DocumentStatus } from "@prisma/client";

export async function processDocument(
  documentId: string,
  buffer: Buffer,
): Promise<void> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    let extractedText = "";

    if (document.type === "application/pdf") {
      const data = await pdfParse(buffer);
      extractedText = data.text;

      if (!extractedText || extractedText.trim().length === 0) {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.error,
            error:
              "OCR Required: this PDF appears to be image-based and cannot be processed.",
          },
        });
        return;
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(extractedText);

    await prisma.chunk.createMany({
      data: chunks.map((content, index) => ({
        content,
        chunkIndex: index,
        documentId,
      })),
    });

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        status: DocumentStatus.ready,
      },
    });
  } catch (err) {
    const error = err as Error;
    await prisma.document
      .update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.error,
          error: error.message,
        },
      })
      .catch((updateErr: unknown) => {
        const e = updateErr as { code?: string };
        if (e.code !== "P2025") {
          console.error("Failed to update document error status:", updateErr);
        }
      });
  }
}
