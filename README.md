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
npx prisma migrate deploy
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

## Render Deployment

Deploy frontend, backend, and database all on [Render](https://render.com).

### 1. Create a PostgreSQL database
Render dashboard → **New +** → **Postgres** → Free plan.
Copy the **Internal Database URL** once it's ready.

### 2. Deploy the backend
- **New +** → **Web Service** → select this repo
- Set **Root Directory** to `backend`
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- Add environment variables:
  ```
  DATABASE_URL=paste internal database URL here
  GROQ_API_KEY=your_groq_api_key
  FRONTEND_URL=https://your-frontend.onrender.com
  NODE_ENV=production
  ```
- The start script runs `prisma migrate deploy` before launching the server.
- Note the generated backend URL once deployed.

### 3. Deploy the frontend
- **New +** → **Static Site** → select this repo
- Set **Root Directory** to `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- Add environment variable:
  ```
  VITE_API_URL=https://your-backend.onrender.com
  ```

> **Order matters:** deploy the backend first so you have its URL before building the frontend.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/documents | List all documents |
| GET | /api/documents/:id | Get document metadata |
| POST | /api/documents | Upload a document |
| DELETE | /api/documents/:id | Delete a document |
| POST | /api/chat | Chat with a specific document (SSE) |
| POST | /api/chat/general | Chat across all documents (SSE) |
