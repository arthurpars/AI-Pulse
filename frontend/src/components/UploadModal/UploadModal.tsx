import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  DragEvent,
  ChangeEvent,
} from "react";
import { Upload, X, FileText, File, Loader } from "lucide-react";
import { uploadDocument } from "../../api/client";
import "./UploadModal.css";

interface Props {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export interface UploadModalHandle {
  openFilePicker: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const UploadModal = forwardRef<UploadModalHandle, Props>(function UploadModal(
  { onSuccess, onError },
  ref,
) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openFilePicker: () => fileInputRef.current?.click(),
  }));

  const ALLOWED = ["application/pdf", "text/plain", "text/markdown"];
  const MAX_SIZE = 10 * 1024 * 1024;

  function validateFile(file: File): string | null {
    if (!ALLOWED.includes(file.type) && !file.name.endsWith(".md")) {
      return `${file.name}: unsupported type. Use PDF, TXT, or Markdown.`;
    }
    if (file.size > MAX_SIZE) {
      return `${file.name}: exceeds 10MB limit.`;
    }
    return null;
  }

  function addFiles(files: FileList) {
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      const err = validateFile(f);
      if (err) {
        onError(err);
        return;
      }
      valid.push(f);
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    onError("");
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0 || uploading) return;
    setUploading(true);
    onError("");

    try {
      for (const file of selectedFiles) {
        await uploadDocument(file);
      }
      setSelectedFiles([]);
      onSuccess();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-area">
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          multiple
          onChange={onFileChange}
          className="hidden-input"
        />
        <div className="drop-zone-icon">
          <Upload size={22} />
        </div>
        <p className="drop-zone-title">Drop your documents here</p>
        <p className="drop-zone-hint">PDF, TXT, or Markdown up to 10MB</p>
        <button
          className="browse-link"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          type="button"
        >
          Browse files
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          {selectedFiles.map((file, i) => (
            <div key={i} className="selected-file">
              <div className="selected-file-icon">
                {file.type === "application/pdf" ? (
                  <File size={16} />
                ) : (
                  <FileText size={16} />
                )}
              </div>
              <div className="selected-file-info">
                <span className="selected-file-name">{file.name}</span>
                <span className="selected-file-size">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                className="selected-file-remove"
                onClick={() => removeFile(i)}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading}
            type="button"
          >
            {uploading ? (
              <>
                <Loader size={15} className="spinning" />
                Uploading…
              </>
            ) : (
              `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </div>
  );
});

export default UploadModal;
