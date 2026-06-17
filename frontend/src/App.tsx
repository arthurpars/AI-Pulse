import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileSearch,
  FileText,
  File,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useDocuments } from "./hooks/useDocuments";
import { useTheme } from "./hooks/useTheme";
import Dashboard from "./components/Dashboard/Dashboard";
import ChatWindow from "./components/ChatWindow/ChatWindow";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import { AppView, Document } from "./types";
import "./App.css";

export default function App() {
  const [view, setView] = useState<AppView>({ type: "dashboard" });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [theme, toggleTheme] = useTheme();

  const currentDraftKey =
    view.type === "document-chat" ? view.documentId :
    view.type === "general-chat" ? "general" : "";
  const currentDraft = currentDraftKey ? (draftInputs[currentDraftKey] ?? "") : "";
  function setCurrentDraft(val: string) {
    if (currentDraftKey) setDraftInputs((prev) => ({ ...prev, [currentDraftKey]: val }));
  }
  const { documents } = useDocuments();

  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth > 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const readyDocuments = documents.filter((d) => d.status === "ready");

  function closeIfMobile() {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }

  function openDocumentChat(doc: Document, chunkCount?: number) {
    setView({ type: "document-chat", documentId: doc.id, documentName: doc.name, chunkCount });
    closeIfMobile();
  }

  function openGeneralChat() {
    setView({ type: "general-chat" });
    closeIfMobile();
  }

  function goToDashboard() {
    setView({ type: "dashboard" });
    closeIfMobile();
  }

  const isDocChat =
    view.type === "document-chat" || view.type === "general-chat";

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          title="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="mobile-logo">
          <div className="sidebar-logo-icon">
            <FileSearch size={16} />
          </div>
          <span className="sidebar-logo-name">AI-Pulse</span>
        </div>
        <div className="mobile-header-spacer" />
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <FileSearch size={18} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">AI-Pulse</span>
            <span className="sidebar-logo-sub">Onboarder</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${view.type === "dashboard" ? "active" : ""}`}
            onClick={goToDashboard}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-nav-item ${view.type === "general-chat" ? "active" : ""}`}
            onClick={openGeneralChat}
          >
            <MessageSquare size={16} />
            <span>All Documents Chat</span>
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </nav>

        <div className="sidebar-docs">
          <span className="sidebar-section-label">Documents</span>
          {documents.length === 0 ? (
            <div className="sidebar-docs-empty">
              <MessageSquare size={16} />
              <span>Upload documents to start chatting</span>
            </div>
          ) : (
            <div className="sidebar-docs-list">
              {documents.map((doc) => {
                const isActive =
                  view.type === "document-chat" && view.documentId === doc.id;
                return (
                  <button
                    key={doc.id}
                    className={`sidebar-doc-item ${isActive ? "active" : ""}`}
                    onClick={() =>
                      doc.status === "ready" && openDocumentChat(doc)
                    }
                    disabled={doc.status !== "ready"}
                  >
                    {doc.type === "application/pdf" ? (
                      <File size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                    <span>{doc.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {!isDocChat ? (
          <Dashboard
            documents={documents}
            readyCount={readyDocuments.length}
            onOpenChat={openDocumentChat}
            onOpenGeneral={openGeneralChat}
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
          />
        ) : view.type === "document-chat" ? (
          <ChatWindow
            key={view.documentId}
            documentId={view.documentId}
            documentName={view.documentName}
            chunkCount={view.chunkCount}
            isGeneral={false}
            inputValue={currentDraft}
            onInputChange={setCurrentDraft}
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
          />
        ) : (
          <ChatWindow
            key="general"
            isGeneral={true}
            documentCount={readyDocuments.length}
            inputValue={currentDraft}
            onInputChange={setCurrentDraft}
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
          />
        )}
      </main>
    </div>
  );
}
