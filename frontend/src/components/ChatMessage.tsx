import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { User, Bot, Copy, RotateCcw } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onResend?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isStreaming = false,
  onResend 
}) => {
  const isUser = message.role === 'user';
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatContent = (content: string) => {
    // 简单的 markdown 渲染
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`chat-message fade-in-up ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="flex items-start space-x-4">
        {/* 头像 */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* 消息内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold ${
              isUser ? 'text-blue-600' : 'text-purple-600'
            }`}>
              {isUser ? '你' : 'AI助手'}
            </span>
            <div className="flex items-center space-x-3">
              {message.timestamp && (
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
              <button
                onClick={copyToClipboard}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                title="复制"
              >
                <Copy size={16} />
              </button>
              {isUser && onResend && (
                <button
                  onClick={onResend}
                  className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                  title="重新发送"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 消息文本 */}
          <div className="prose prose-sm max-w-none">
            {isStreaming && !isUser ? (
              <div className="flex items-center space-x-2">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(message.content) 
                  }} 
                />
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(message.content) 
                }} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
