import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useChat } from './hooks/useChat';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
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
  } = useChat();

  // 初始化加载对话列表
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 自动滚动到底部
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (message: string, useSearch?: boolean) => {
    sendMessage(message, useSearch);
    // 在移动端发送消息后关闭侧边栏
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversationMessages(conversationId);
    // 在移动端选择对话后关闭侧边栏
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = () => {
    startNewConversation();
    // 在移动端创建新对话后关闭侧边栏
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* 顶部导航栏 - 固定高度 */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">
              {currentConversationId ? '对话中' : '智能AI助手'}
            </h1>
          </div>

          {/* 状态指示器 */}
          {isStreaming && (
            <div className="flex items-center space-x-2 sm:space-x-3 text-sm flex-shrink-0">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full pulse-ring"></div>
              </div>
              <span className="text-blue-600 font-medium hidden sm:inline">AI正在思考...</span>
              <span className="text-blue-600 font-medium sm:hidden">思考中...</span>
            </div>
          )}
        </header>

        {/* 聊天区域 - 自适应高度 */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <WelcomeScreen onSendMessage={handleSendMessage} />
            </div>
          ) : (
            <div
              id="chat-container"
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 pb-safe chat-container-mobile md:max-h-[calc(100vh-140px)]"
              style={{
                minHeight: '200px' // 确保最小高度
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                    onResend={message.role === 'user' ? resendLastMessage : undefined}
                  />
                ))
              )}
            </div>
          )}

          {/* 输入区域 - 固定在底部 */}
          <div className="flex-shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              onInterrupt={interruptStream}
              isStreaming={isStreaming}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
