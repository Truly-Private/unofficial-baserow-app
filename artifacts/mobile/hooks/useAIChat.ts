import { useState, useCallback, useRef } from 'react';
import { AIService, AIMessage, ParsedIntent } from '@/lib/ai-service';

export interface ChatMessage extends AIMessage {
  id: string;
  isLoading?: boolean;
  error?: string;
}

export interface UseAIChatOptions {
  tableId?: number;
  tableName?: string;
  fields?: Array<{ id: number; name: string; type: string }>;
  onRecordCreate?: (fields: Record<string, any>) => Promise<void>;
}

export function useAIChat(options: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<ParsedIntent | null>(null);
  
  const aiServiceRef = useRef<AIService | null>(null);

  // Initialize AI service
  const initializeAI = useCallback((apiKey: string, provider: 'openai' | 'anthropic' = 'openai') => {
    aiServiceRef.current = new AIService({
      provider,
      apiKey,
      model: provider === 'openai' ? 'gpt-4' : 'claude-3-sonnet-20240229',
    });
  }, []);

  // Add message to chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // Update message by ID
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  // Send user message and get AI response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!aiServiceRef.current) {
        addMessage({
          role: 'assistant',
          content: 'AI service not initialized. Please configure your API key in settings.',
          timestamp: Date.now(),
          error: 'not_initialized',
        });
        return;
      }

      // Add user message
      addMessage({
        role: 'user',
        content,
        timestamp: Date.now(),
      });

      // Add loading message
      const loadingId = addMessage({
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isLoading: true,
      });

      setIsProcessing(true);

      try {
        // Parse intent with AI
        const intent = await aiServiceRef.current.parseIntent(content, {
          tableId: options.tableId,
          tableName: options.tableName,
          fields: options.fields,
        });

        // Remove loading message
        setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

        // Handle different intents
        if (intent.clarificationNeeded) {
          // AI needs more information
          addMessage({
            role: 'assistant',
            content: intent.clarificationPrompt || 'Could you provide more details?',
            timestamp: Date.now(),
          });
        } else if (intent.intent === 'create_record') {
          // Show record preview and ask for confirmation
          setPendingIntent(intent);
          
          const fieldsList = Object.entries(intent.fields)
            .map(([key, value]) => `• ${key}: ${value}`)
            .join('\n');

          let confirmMessage = `I'll create a new record with:\n\n${fieldsList}`;
          
          if (intent.missingFields && intent.missingFields.length > 0) {
            confirmMessage += `\n\nMissing fields: ${intent.missingFields.join(', ')}`;
          }
          
          confirmMessage += '\n\nShould I proceed?';

          addMessage({
            role: 'assistant',
            content: confirmMessage,
            timestamp: Date.now(),
          });
        } else if (intent.intent === 'unknown') {
          addMessage({
            role: 'assistant',
            content: "I'm not sure what you want to do. Try saying something like:\n• Add a new task\n• Create a customer record\n• Update the status",
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        updateMessage(loadingId, {
          content: 'Sorry, I encountered an error. Please try again.',
          isLoading: false,
          error: error instanceof Error ? error.message : 'unknown',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [options, addMessage, updateMessage]
  );

  // Confirm and create record
  const confirmCreate = useCallback(async () => {
    if (!pendingIntent || !options.onRecordCreate) {
      return;
    }

    addMessage({
      role: 'assistant',
      content: 'Creating record...',
      timestamp: Date.now(),
      isLoading: true,
    });

    try {
      await options.onRecordCreate(pendingIntent.fields);
      
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      
      addMessage({
        role: 'assistant',
        content: '✓ Record created successfully!',
        timestamp: Date.now(),
      });

      setPendingIntent(null);
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      
      addMessage({
        role: 'assistant',
        content: `Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        error: 'create_failed',
      });
    }
  }, [pendingIntent, options, addMessage]);

  // Cancel pending action
  const cancelAction = useCallback(() => {
    setPendingIntent(null);
    addMessage({
      role: 'assistant',
      content: 'Cancelled. What else can I help you with?',
      timestamp: Date.now(),
    });
  }, [addMessage]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setPendingIntent(null);
    if (aiServiceRef.current) {
      aiServiceRef.current.clearHistory();
    }
  }, []);

  return {
    messages,
    isProcessing,
    pendingIntent,
    sendMessage,
    confirmCreate,
    cancelAction,
    clearChat,
    initializeAI,
  };
}
