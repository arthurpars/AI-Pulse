# AI-Pulse Onboarder

A full-stack document-powered AI chat assistant. Upload company handbooks, guides, or policies and chat with them using an LLM-powered RAG pipeline.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Infrastructure | Docker Compose |
| File Upload | Multer (memory storage) |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Data Fetching | SWR |
| Text Processing | pdf-parse, @langchain/textsplitters |

## Setup

### 1. Clone and enter project

```bash
cd ai-pulse-onboarder
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set your GROQ_API_KEY
```

Get a free Groq API key at https://console.groq.com

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Start backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on http://localhost:3001

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Features

- **Document Upload** — Drag & drop PDF, TXT, or Markdown files (up to 10MB)
- **RAG Chat** — Ask questions about individual documents
- **Knowledge Base Chat** — Cross-reference across all uploaded documents
- **Streaming Responses** — Real-time SSE streaming from Groq LLM
- **Auto-polling** — Documents refresh every 3s during processing

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/documents | List all documents |
| GET | /api/documents/:id | Get document metadata |
| POST | /api/documents | Upload a document |
| DELETE | /api/documents/:id | Delete a document |
| POST | /api/chat | Chat with a specific document (SSE) |
| POST | /api/chat/general | Chat across all documents (SSE) |
