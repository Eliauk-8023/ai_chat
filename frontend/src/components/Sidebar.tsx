import React, { useState } from 'react';
import { Conversation } from '../types';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  MoreVertical,
  Search,
  Settings,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateInput: string | Date) => {
    let date: Date;

    // 确保正确解析时间
    if (typeof dateInput === 'string') {
      // 处理各种时间格式
      date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        // 如果解析失败，尝试ISO格式
        date = new Date(dateInput.replace('Z', '+00:00'));
      }
    } else {
      date = dateInput;
    }

    // 如果仍然无效，使用当前时间
    if (isNaN(date.getTime())) {
      date = new Date();
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200/50
        transform transition-transform duration-300 ease-in-out shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-bold gradient-text">AI助手</h1>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 新建对话按钮 */}
          <div className="p-3 sm:p-4">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3
                bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200
                hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span>新建对话</span>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索对话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 对话列表 */}
          <div className="flex-1 overflow-y-auto px-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p>暂无对话记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200
                      hover:bg-gray-50 ${
                        currentConversationId === conversation.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:shadow-sm'
                      }`}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {conversation.title || '新对话'}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDate(conversation.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {truncateText(conversation.last_message)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-500 font-medium">
                            {conversation.message_count} 条消息
                          </span>
                          <span className="text-xs text-gray-400">
                            {(() => {
                              const date = typeof conversation.timestamp === 'string'
                                ? new Date(conversation.timestamp)
                                : conversation.timestamp;
                              return date.toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* 更多操作按钮 */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(
                              activeDropdown === conversation.id ? null : conversation.id
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 
                            hover:text-gray-600 transition-all duration-200"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* 下拉菜单 */}
                        {activeDropdown === conversation.id && (
                          <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 
                            rounded-lg shadow-lg z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conversation.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 
                                hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                              <span>删除</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部设置 */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 
              hover:bg-gray-50 rounded-lg transition-colors">
              <Settings size={16} />
              <span>设置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </>
  );
};
