import { useState } from "react";
import {
  File,
  FileText,
  MessageSquare,
  Trash2,
  Clock,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Document } from "../../types";
import { deleteDocument } from "../../api/client";
import "./DocumentCard.css";

interface Props {
  document: Document;
  onOpenChat: (chunkCount?: number) => void;
  onDelete: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function DocumentCard({
  document,
  onOpenChat,
  onDelete,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteDocument(document.id);
      onDelete();
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  const isPdf = document.type === "application/pdf";

  return (
    <div className={`doc-card ${document.status}`}>
      <div className="doc-card-icon">
        {isPdf ? <File size={18} /> : <FileText size={18} />}
      </div>

      <div className="doc-card-info">
        <span className="doc-card-name">{document.name}</span>
        <div className="doc-card-meta">
          <Clock size={12} />
          <span>{formatDate(document.uploadedAt)}</span>
          <span className="meta-sep">·</span>
          <span>{formatSize(document.size)}</span>
          {document.status === "ready" && document._count !== undefined && (
            <>
              <span className="meta-sep">·</span>
              <span className="doc-card-chunks">
                {document._count.chunks} chunk
                {document._count.chunks !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        {document.status === "error" && document.error && (
          <div className="doc-card-error">
            <AlertCircle size={12} />
            <span>{document.error}</span>
          </div>
        )}
      </div>

      <div className="doc-card-status">
        {document.status === "processing" && (
          <span className="status-badge processing">
            <Loader size={11} className="spinning" />
            Processing
          </span>
        )}
        {document.status === "error" && (
          <span className="status-badge error">Error</span>
        )}
      </div>

      <div className="doc-card-actions">
        <button
          className="doc-action-btn chat"
          onClick={() => onOpenChat(document._count?.chunks)}
          disabled={document.status !== "ready"}
          title="Chat with this document"
        >
          <MessageSquare size={15} />
        </button>

        {showConfirm ? (
          <div className="delete-confirm">
            <button
              className="doc-action-btn confirm-delete"
              onClick={handleDelete}
              disabled={deleting}
              title="Confirm delete"
            >
              {deleting ? <Loader size={14} className="spinning" /> : "Delete"}
            </button>
            <button
              className="doc-action-btn"
              onClick={() => setShowConfirm(false)}
              title="Cancel"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="doc-action-btn delete"
            onClick={handleDelete}
            title="Delete document"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
