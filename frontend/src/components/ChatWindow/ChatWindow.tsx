import { useRef, useEffect, KeyboardEvent } from "react";
import { PanelLeft, File, MessageSquare, Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "../../hooks/useChat";
import "./ChatWindow.css";

interface Props {
  documentId?: string;
  documentName?: string;
  chunkCount?: number;
  isGeneral: boolean;
  documentCount?: number;
  inputValue: string;
  onInputChange: (val: string) => void;
  onToggleSidebar: () => void;
}

const SUGGESTIONS = [
  "What documents are available?",
  "Summarize all documents briefly",
  "What are the key policies across all documents?",
  "Are there any conflicting information between documents?",
];

export default function ChatWindow({
  documentId,
  documentName,
  chunkCount,
  isGeneral,
  documentCount,
  inputValue,
  onInputChange,
  onToggleSidebar,
}: Props) {
  const { messages, isStreaming, error, sendMessage, loadSession } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void loadSession(documentId, isGeneral);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [documentId, isGeneral]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [inputValue]);

  function handleSend() {
    const content = inputValue.trim();
    if (!content || isStreaming) return;
    onInputChange("");
    sendMessage(content, documentId, isGeneral);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestion(text: string) {
    sendMessage(text, documentId, isGeneral);
  }

  const showLanding = messages.length === 0 && isGeneral;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button
          className="chat-header-sidebar-btn"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <div className="chat-header-info">
          {isGeneral ? (
            <MessageSquare size={16} className="chat-header-icon" />
          ) : (
            <File size={16} className="chat-header-icon" />
          )}
          <span className="chat-header-title">
            {isGeneral
              ? "All Documents Chat"
              : (documentName ?? "Document Chat")}
          </span>
          {isGeneral && documentCount !== undefined && (
            <span className="chat-header-badge">
              {documentCount} document{documentCount !== 1 ? "s" : ""}
            </span>
          )}
          {!isGeneral && chunkCount !== undefined && (
            <span className="chat-header-badge">{chunkCount} chunks</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {showLanding ? (
          <div className="chat-landing">
            <div className="chat-landing-icon">
              <MessageSquare size={32} />
            </div>
            <h2 className="chat-landing-title">Chat with all your documents</h2>
            <p className="chat-landing-subtitle">
              Ask questions across <strong>all uploaded documents</strong>.
              <br />
              The AI will search through everything
              <br />
              and cross-reference information for you.
            </p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="suggestion-btn"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="message-avatar assistant-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div className="message-bubble">
                  {msg.role === "assistant" ? (
                    msg.content === "" &&
                    isStreaming &&
                    i === messages.length - 1 ? (
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="message-avatar user-avatar">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {error && (
              <div className="chat-error">
                <span>{error}</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={
              isGeneral
                ? "Ask a question across all your documents…"
                : "Ask a question about this document…"
            }
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="chat-disclaimer">
          AI responses are generated from the document content. Always verify
          important information.
        </p>
      </div>
    </div>
  );
}
