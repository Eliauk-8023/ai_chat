export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  last_message: string;
  timestamp: Date;
  message_count: number;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  conversation_id?: string;
  error?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentConversationId?: string;
  conversations: Conversation[];
  isStreaming: boolean;
}
