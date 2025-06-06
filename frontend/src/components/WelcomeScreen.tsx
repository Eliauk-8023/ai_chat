import React from 'react';
import { 
  MessageSquare, 
  Search, 
  Lightbulb, 
  Code, 
  BookOpen, 
  Zap 
} from 'lucide-react';

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const suggestions = [
    {
      icon: <Code className="text-blue-500" size={20} />,
      title: "编程助手",
      description: "帮我写一个Python函数来计算斐波那契数列",
      prompt: "帮我写一个Python函数来计算斐波那契数列"
    },
    {
      icon: <Search className="text-green-500" size={20} />,
      title: "信息搜索",
      description: "搜索最新的人工智能发展趋势",
      prompt: "搜索最新的人工智能发展趋势"
    },
    {
      icon: <Lightbulb className="text-yellow-500" size={20} />,
      title: "创意灵感",
      description: "给我一些创业项目的想法",
      prompt: "给我一些创业项目的想法"
    },
    {
      icon: <BookOpen className="text-purple-500" size={20} />,
      title: "学习辅导",
      description: "解释一下机器学习的基本概念",
      prompt: "解释一下机器学习的基本概念"
    }
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full text-center">
        {/* 主标题 */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
            bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full mb-4 sm:mb-6
            shadow-2xl neon-glow floating">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-4 sm:mb-6">
            智能AI助手
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            我是您的智能助手，可以帮助您解答问题、编写代码、搜索信息、提供创意灵感等。
            让我们开始对话吧！
          </p>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          <button
            onClick={() => onSendMessage("你好，请介绍一下你的功能")}
            className="p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl hover-lift group cursor-pointer transition-all duration-300"
          >
            <MessageSquare className="text-blue-500 mb-2 sm:mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 text-sm sm:text-base">智能对话</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">自然流畅的对话体验</p>
          </button>

          <button
            onClick={() => onSendMessage("搜索最新的人工智能发展趋势")}
            className="p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl hover-lift group cursor-pointer transition-all duration-300"
          >
            <Search className="text-green-500 mb-2 sm:mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-600 text-sm sm:text-base">网络搜索</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">实时获取最新信息</p>
          </button>

          <button
            onClick={() => onSendMessage("帮我写一个Python函数来计算斐波那契数列")}
            className="p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl hover-lift group cursor-pointer transition-all duration-300"
          >
            <Code className="text-purple-500 mb-2 sm:mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-600 text-sm sm:text-base">代码助手</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">编程问题解答与代码生成</p>
          </button>

          <button
            onClick={() => onSendMessage("给我一些创业项目的想法")}
            className="p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl hover-lift group cursor-pointer transition-all duration-300"
          >
            <Lightbulb className="text-yellow-500 mb-2 sm:mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-yellow-600 text-sm sm:text-base">创意灵感</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">激发创意与想象力</p>
          </button>
        </div>

        {/* 建议问题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            试试这些问题
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion.prompt)}
                className="p-6 glass-effect rounded-2xl hover:border-blue-300
                  hover:shadow-xl transition-all duration-300 text-left group hover-lift"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 
                      transition-colors mb-1">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-sm text-gray-500">
          <p>💡 提示：您可以随时中断AI的回复，也可以重新发送消息</p>
        </div>
      </div>
    </div>
  );
};
