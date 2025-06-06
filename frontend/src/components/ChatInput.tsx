import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Search } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, useSearch?: boolean) => void;
  onInterrupt: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onInterrupt,
  isStreaming,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), useSearch);
      setMessage('');
      // 保持搜索状态，不重置
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-xl p-3 sm:p-4 lg:p-6 safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          {/* 搜索选项 */}
          <div className="flex items-center mb-3 sm:mb-4">
            <label className="flex items-center space-x-2 sm:space-x-3 text-sm text-gray-700 cursor-pointer group">
              <input
                type="checkbox"
                checked={useSearch}
                onChange={(e) => setUseSearch(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all"
              />
              <Search size={16} className={`sm:w-[18px] sm:h-[18px] transition-colors ${useSearch ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`transition-colors text-xs sm:text-sm ${useSearch ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                启用网络搜索
              </span>
            </label>
          </div>

          {/* 输入框 */}
          <div className="relative flex items-start space-x-3 sm:space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? "AI正在回复中..." : "输入你的问题..."}
                disabled={disabled || isStreaming}
                className={`w-full resize-none rounded-xl sm:rounded-2xl border border-gray-300
                  px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200
                  min-h-[44px] sm:min-h-[52px] max-h-24 sm:max-h-32 ${isStreaming ? 'cursor-not-allowed' : ''}`}
                rows={1}
              />

              {/* 字符计数 */}
              {message.length > 0 && (
                <div className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 text-xs text-gray-400">
                  {message.length}
                </div>
              )}
            </div>

            {/* 发送/停止按钮 */}
            <div className="flex-shrink-0 pt-0.5 sm:pt-1">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onInterrupt}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 text-white
                    rounded-full flex items-center justify-center transition-all duration-200
                    hover:scale-105 active:scale-95 shadow-lg"
                  title="停止生成"
                >
                  <Square size={16} className="sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim() || disabled}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${message.trim() && !disabled
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  title="发送消息"
                >
                  <Send size={16} className="sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* 提示文本 */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            <span className="hidden sm:inline">按 Enter 发送，Shift + Enter 换行</span>
            <span className="sm:hidden">Enter发送，Shift+Enter换行</span>
          </div>
        </div>
      </form>
    </div>
  );
};
