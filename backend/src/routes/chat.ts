import { Router, Request, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { groq } from "../lib/groq";
import {
  buildPerDocumentContext,
  buildGeneralContext,
} from "../services/ragService";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many chat requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatBodySchema = z.object({
  sessionId: z.string().nullish(),
  documentId: z.string().nullish(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).min(1),
});

async function streamChat(
  req: Request,
  res: Response,
  isGeneral: boolean,
): Promise<void> {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const { sessionId, documentId, messages } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    let session = null;

    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
    }

    if (!session) {
      if (isGeneral) {
        session = await prisma.chatSession.create({
          data: {
            documentId: null,
            type: "general",
            title: "Knowledge Base Chat",
          },
        });
      } else {
        if (!documentId) {
          res.write(
            `data: ${JSON.stringify({ error: "documentId is required" })}\n\n`,
          );
          res.end();
          return;
        }
        const document = await prisma.document.findUnique({
          where: { id: documentId },
          select: { name: true },
        });
        session = await prisma.chatSession.create({
          data: {
            documentId,
            title: document?.name ?? "Document Chat",
          },
        });
      }
    }

    const context = isGeneral
      ? await buildGeneralContext()
      : await buildPerDocumentContext(documentId ?? "");

    const systemPrompt = `You are an AI Onboarding Assistant. Use ONLY the context below to answer the user's question.
If the answer is not found in the context, clearly state that you don't know.
Always cite the document name when referencing information.

Context:
${context}`;

    const conversationMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ],
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    const userMessage = messages[messages.length - 1];
    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: session.id,
          role: "user",
          content: userMessage.content,
        },
        {
          sessionId: session.id,
          role: "assistant",
          content: fullResponse,
        },
      ],
    });

    res.write(`data: [SESSION:${session.id}]\n\n`);
    res.end();
  } catch (err) {
    const error = err as Error;
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const { documentId, type } = req.query;
    const session = await prisma.chatSession.findFirst({
      where:
        type === "general"
          ? { type: "general" }
          : { documentId: String(documentId) },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { id: "asc" } },
      },
    });
    res.json(session ?? null);
  } catch {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.post("/", chatLimiter, (req: Request, res: Response) => {
  void streamChat(req, res, false);
});

router.post("/general", chatLimiter, (req: Request, res: Response) => {
  void streamChat(req, res, true);
});

export default router;
