import { useState, useRef } from 'react'
import { PanelLeft } from 'lucide-react'
import { Document } from '../../types'
import DocumentCard from '../DocumentCard/DocumentCard'
import UploadModal, { UploadModalHandle } from '../UploadModal/UploadModal'
import EmptyState from '../shared/EmptyState'
import { useDocuments } from '../../hooks/useDocuments'
import './Dashboard.css'

interface Props {
  documents: Document[]
  readyCount: number
  onOpenChat: (doc: Document, chunkCount?: number) => void
  onOpenGeneral: () => void
  onToggleSidebar: () => void
}

export default function Dashboard({ documents, readyCount, onOpenChat, onOpenGeneral, onToggleSidebar }: Props) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { mutate } = useDocuments()
  const uploadModalRef = useRef<UploadModalHandle>(null)

  async function handleUploadSuccess() {
    setUploadError(null)
    await mutate()
  }

  async function handleDelete() {
    await mutate()
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <PanelLeft size={18} />
        </button>
        <h1 className="dashboard-title">Dashboard</h1>
        {readyCount > 0 && (
          <button className="btn-knowledge-base" onClick={onOpenGeneral}>
            <span>Knowledge Base Chat</span>
            <span className="badge">{readyCount} document{readyCount !== 1 ? 's' : ''}</span>
          </button>
        )}
      </div>
      <div className="dashboard-divider" />

      <div className="dashboard-content">
        <section className="upload-section">
          <h2 className="section-title">Upload Documents</h2>
          <p className="section-subtitle">
            Drop your company handbooks, guides, or policies to enable AI-powered Q&amp;A.
          </p>
          <UploadModal
            ref={uploadModalRef}
            onSuccess={handleUploadSuccess}
            onError={setUploadError}
          />
          {uploadError && (
            <p className="upload-error">{uploadError}</p>
          )}
        </section>

        <section className="documents-section">
          <div className="documents-header">
            <h2 className="section-title">Your Documents</h2>
            {documents.length > 0 && (
              <span className="documents-count">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <EmptyState onUploadClick={() => uploadModalRef.current?.openFilePicker()} />
          ) : (
            <div className="documents-list">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onOpenChat={(chunkCount) => onOpenChat(doc, chunkCount)}
                  onDelete={() => handleDelete()}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
