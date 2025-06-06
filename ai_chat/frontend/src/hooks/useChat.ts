import { useState, useCallback, useRef } from 'react';
import { ChatMessage, Conversation, StreamChunk } from '../types';
import { ChatAPI, SSEService } from '../services/api';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cancelStreamRef = useRef<(() => void) | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await ChatAPI.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const msgs = await ChatAPI.getConversationMessages(conversationId);
      setMessages(msgs);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    useSearch: boolean = false
  ) => {
    if (isStreaming) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      conversation_id: currentConversationId,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // 添加空的助手消息用于流式更新
    const assistantMessage: ChatMessage = {
      id: Date.now().toString() + '_assistant',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      conversation_id: currentConversationId,
    };

    setMessages(prev => [...prev, assistantMessage]);

    // 使用ref来跟踪累积的内容，避免状态更新问题
    let accumulatedContent = '';

    try {
      const cancelStream = await SSEService.createChatStream(
        content,
        currentConversationId,
        useSearch,
        (chunk: StreamChunk) => {
          console.log('收到chunk:', chunk); // 调试日志

          if (chunk.type === 'content' && chunk.content) {
            // 累积内容
            accumulatedContent += chunk.content;

            // 更新消息，使用累积的完整内容
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = accumulatedContent; // 直接设置完整内容
              }
              return newMessages;
            });
          } else if (chunk.type === 'done') {
            setIsStreaming(false);
            if (chunk.conversation_id && !currentConversationId) {
              setCurrentConversationId(chunk.conversation_id);
            }
            loadConversations();
          } else if (chunk.type === 'error') {
            console.error('Stream error:', chunk.error);
            setIsStreaming(false);
          }
        },
        (error: string) => {
          console.error('Stream error:', error);
          setIsStreaming(false);
        },
        () => {
          setIsStreaming(false);
        }
      );

      cancelStreamRef.current = cancelStream;

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
    }
  }, [currentConversationId, isStreaming, loadConversations]);

  const interruptStream = useCallback(async () => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(undefined);
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await ChatAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [currentConversationId, startNewConversation]);

  const resendLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && !isStreaming) {
      // 移除最后的助手回复（如果有的话）
      setMessages(prev => {
        const lastIndex = prev.findIndex(m => m.id === lastUserMessage.id);
        return prev.slice(0, lastIndex + 1);
      });
      
      sendMessage(lastUserMessage.content);
    }
  }, [messages, isStreaming, sendMessage]);

  return {
    messages,
    conversations,
    currentConversationId,
    isStreaming,
    isLoading,
    sendMessage,
    interruptStream,
    loadConversations,
    loadConversationMessages,
    startNewConversation,
    deleteConversation,
    resendLastMessage,
  };
};
