import { ChatMessage, Conversation, SearchResult } from '../types';

const API_BASE = '/api';

export class ChatAPI {
  static async sendMessage(
    message: string,
    conversationId?: string,
    useSearch: boolean = false
  ): Promise<EventSource> {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        use_search: useSearch,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    // 返回 EventSource 用于 SSE
    const eventSource = new EventSource(`${API_BASE}/chat/stream`, {
      withCredentials: true,
    });

    return eventSource;
  }

  static async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE}/conversations`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return response.json();
  }

  static async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
  }

  static async searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to search');
    }
    return response.json();
  }

  static async interruptChat(streamId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/interrupt/${streamId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to interrupt chat');
    }
  }
}

export class SSEService {
  static async createChatStream(
    message: string,
    conversationId?: string,
    useSearch: boolean = false,
    onMessage: (chunk: any) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<() => void> {
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          use_search: useSearch,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let cancelled = false;

      const processStream = async () => {
        try {
          while (!cancelled) {
            const { done, value } = await reader.read();

            if (done) {
              onComplete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    onMessage(data);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e, 'Line:', line);
                }
              }
            }
          }
        } catch (error) {
          if (!cancelled) {
            onError(error instanceof Error ? error.message : 'Stream error');
          }
        } finally {
          reader.releaseLock();
        }
      };

      processStream();

      // 返回取消函数
      return () => {
        cancelled = true;
        reader.cancel();
      };

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to start stream');
      return () => {};
    }
  }
}
