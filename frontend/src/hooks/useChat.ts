import { useState, useCallback } from "react";
import { ChatMessage } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setIsStreaming(false);
    setError(null);
  }, []);

  const loadSession = useCallback(
    async (documentId?: string, isGeneral?: boolean) => {
      setMessages([]);
      setSessionId(null);
      setIsStreaming(false);
      setError(null);
      try {
        const params = isGeneral
          ? "type=general"
          : `documentId=${documentId ?? ""}`;
        const res = await fetch(`${BASE_URL}/api/chat/sessions?${params}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          id: string;
          messages: Array<{ role: string; content: string }>;
        } | null;
        if (!data?.messages?.length) return;
        setSessionId(data.id);
        setMessages(
          data.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        );
      } catch {
        // start fresh if session can't be loaded
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, documentId?: string, isGeneral?: boolean) => {
      if (isStreaming) return;

      setError(null);

      const userMsg: ChatMessage = { role: "user", content };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsStreaming(true);

      const endpoint = isGeneral ? "/api/chat/general" : "/api/chat";
      const body: Record<string, unknown> = {
        messages: nextMessages,
        sessionId,
      };
      if (!isGeneral && documentId) {
        body.documentId = documentId;
      }

      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to chat service");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();

            if (data.startsWith("[SESSION:")) {
              const id = data.slice(9, -1);
              setSessionId(id);
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                error?: string;
              };
              if (parsed.error) {
                setError(parsed.error);
                continue;
              }
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err) {
        const e = err as Error;
        setError(e.message);
        setMessages((prev) => {
          const withoutUser = prev.filter((m) => m !== userMsg);
          const last = withoutUser[withoutUser.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return withoutUser.slice(0, -1);
          }
          return withoutUser;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, sessionId, isStreaming],
  );

  return {
    messages,
    sessionId,
    isStreaming,
    error,
    sendMessage,
    reset,
    loadSession,
  };
}
