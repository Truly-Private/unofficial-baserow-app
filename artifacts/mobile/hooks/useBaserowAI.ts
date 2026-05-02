import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth, useCreds } from "@/contexts/AuthContext";
import {
  cancelAssistantSession,
  listAssistantChats,
  listAssistantMessages,
  sendAssistantMessage,
  type BaserowAssistantChat,
  type BaserowAssistantMessage,
} from "@/lib/baserow";

export type ChatMessage = {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isLoading?: boolean;
  error?: string;
  isStreaming?: boolean;
};

export function useBaserowAI(workspaceId: number) {
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const [currentChatUuid, setCurrentChatUuid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const chatsQuery = useQuery({
    queryKey: ["assistant-chats", workspaceId],
    queryFn: () => apiCall((c) => listAssistantChats(c, workspaceId)),
    enabled: !!workspaceId,
  });

  const messagesQuery = useQuery({
    queryKey: ["assistant-messages", currentChatUuid],
    queryFn: () =>
      currentChatUuid ? apiCall((c) => listAssistantMessages(c, currentChatUuid)) : null,
    enabled: !!currentChatUuid,
  });

  // Load existing messages when chat UUID changes
  useEffect(() => {
    if (messagesQuery.data?.results) {
      const history: ChatMessage[] = messagesQuery.data.results.map((m: any) => ({
        id: m.id,
        role: m.sender_type === "user" ? "user" : "assistant",
        content: m.content,
        timestamp: new Date(m.created_on).getTime(),
      }));
      setMessages(history);
    }
  }, [messagesQuery.data]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentChatUuid) throw new Error("No active chat session");

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder for assistant response
      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsProcessing(true);

      try {
        const stream = await sendAssistantMessage(creds, currentChatUuid, content);
        const decoder = new TextDecoder();
        let fullText = "";

        // Iterate over the stream
        // Note: In React Native, res.body is usually an AsyncIterable or a custom stream wrapper
        for await (const chunk of stream as any) {
          const textChunk = typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
          
          // Parse SSE data: ...
          for (const line of textChunk.split(/\r?\n/)) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "ai/message") {
                const delta = event.content ?? "";
                fullText += delta;
                
                // Update assistant message in real-time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: fullText, isLoading: false }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore non-JSON or partial JSON
            }
          }
        }

        // Finalize
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, isLoading: false, error: error instanceof Error ? error.message : "Error" }
              : msg
          )
        );
      } finally {
        setIsProcessing(false);
      }
    },
  });

  const selectChat = (uuid: string) => {
    setCurrentChatUuid(uuid);
    setMessages([]); // Will be populated by messagesQuery
  };

  const startNewChat = () => {
    setCurrentChatUuid(null); // Or trigger a creation mutation if needed
    setMessages([]);
  };

  return {
    chats: chatsQuery.data ?? [],
    messages,
    isProcessing,
    currentChatUuid,
    sendMessage: sendMessageMutation.mutate,
    selectChat,
    startNewChat,
    isLoading: chatsQuery.isLoading || messagesQuery.isLoading,
  };
}
