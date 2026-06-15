import { Router, Request, Response, NextFunction } from "express";
import { DocumentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { upload } from "../middleware/upload";
import { rateLimiter } from "../middleware/rateLimiter";
import { processDocument } from "../services/documentProcessor";

const router = Router();

const documentSelect = {
  id: true,
  name: true,
  originalName: true,
  type: true,
  size: true,
  status: true,
  error: true,
  uploadedAt: true,
  _count: {
    select: { chunks: true },
  },
};

router.get("/", async (_req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      select: documentSelect,
      orderBy: { uploadedAt: "desc" },
    });
    res.json(documents);
  } catch {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      select: documentSelect,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.post(
  "/",
  rateLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const { originalname, mimetype, size, buffer } = req.file;
      const name = originalname.replace(/\.[^/.]+$/, "");

      const document = await prisma.document.create({
        data: {
          name,
          originalName: originalname,
          type: mimetype,
          size,
          status: DocumentStatus.processing,
        },
        select: documentSelect,
      });

      processDocument(document.id, buffer).catch(console.error);

      res.status(201).json(document);
    } catch {
      res.status(500).json({ error: "Failed to create document" });
    }
  },
);

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.document.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
