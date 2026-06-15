import { FileStack, Upload } from "lucide-react";
import "./EmptyState.css";

interface Props {
  onUploadClick?: () => void;
}

export default function EmptyState({ onUploadClick }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FileStack size={28} />
      </div>
      <h3 className="empty-state-title">No documents yet</h3>
      <p className="empty-state-subtitle">
        Upload a PDF, TXT, or Markdown file to get started
      </p>
      {onUploadClick && (
        <button className="empty-state-cta" onClick={onUploadClick}>
          <Upload size={14} />
          Upload your first document
        </button>
      )}
    </div>
  );
}
