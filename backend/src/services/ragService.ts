import { prisma } from "../lib/prisma";

export async function buildPerDocumentContext(
  documentId: string,
): Promise<string> {
  const chunks = await prisma.chunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: "asc" },
    take: 20,
  });

  return chunks.map((c) => c.content).join("\n---\n");
}

export async function buildGeneralContext(): Promise<string> {
  const documents = await prisma.document.findMany({
    where: { status: "ready" },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
        take: 3,
      },
    },
  });

  return documents
    .map((doc) => {
      const chunkContent = doc.chunks.map((c) => c.content).join("\n");
      return `## Document: ${doc.name}\n${chunkContent}`;
    })
    .join("\n\n");
}
