export interface Document {
  id: string
  name: string
  originalName: string
  type: string
  size: number
  status: 'processing' | 'ready' | 'error'
  error?: string
  uploadedAt: string
  _count?: { chunks: number }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export interface ChatSession {
  id: string
  documentId?: string
  type?: string
  title: string
  messages: ChatMessage[]
}

export type AppView =
  | { type: 'dashboard' }
  | { type: 'document-chat'; documentId: string; documentName: string; chunkCount?: number }
  | { type: 'general-chat' }
