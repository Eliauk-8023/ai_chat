import asyncio
import uuid
from datetime import datetime
from typing import AsyncGenerator, List, Optional
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent
from models import ChatMessage, MessageRole, StreamChunk
from database import db
from search_service import search_service
from llms import model_client

class ChatService:
    def __init__(self):
        self.active_streams = {}  # 存储活跃的流式对话
        self.content_buffer = {}  # 存储每个对话的内容缓冲区，用于去重

        # 创建智能助手代理
        self.agent = AssistantAgent(
            name="intelligent_assistant",
            model_client=model_client,
            system_message="""你是一个智能助手，能够帮助用户解答各种问题。
                            你具有以下能力：
                            1. 回答各种知识性问题
                            2. 协助编程和技术问题
                            3. 提供创意和建议
                            4. 进行对话和交流
                            
                            请用友好、专业的语气回答用户的问题。如果用户提供了搜索结果，请结合这些信息来回答问题。
                            请确保回答内容简洁明了，避免重复表达。""",
            model_client_stream=True,  # 支持流式输出
        )
    
    async def chat_stream(
        self, 
        message: str, 
        conversation_id: Optional[str] = None,
        use_search: bool = False
    ) -> AsyncGenerator[StreamChunk, None]:
        """流式聊天"""
        try:
            # 检查是否是新对话
            is_new_conversation = not conversation_id

            # 如果没有对话ID，创建新对话
            if not conversation_id:
                conversation_id = await db.create_conversation()

            # 保存用户消息
            user_message = ChatMessage(
                role=MessageRole.USER,
                content=message,
                timestamp=datetime.now(),
                conversation_id=conversation_id
            )
            await db.save_message(user_message)
            
            # 构建完整的对话上下文
            conversation_context = await self._build_conversation_context(
                conversation_id, message, use_search
            )
            
            # 生成流式ID用于中断控制
            stream_id = str(uuid.uuid4())
            self.active_streams[stream_id] = True

            # 初始化内容缓冲区
            self.content_buffer[stream_id] = ""

            try:
                # 获取流式响应
                result_stream = self.agent.run_stream(task=conversation_context)

                assistant_content = ""
                async for item in result_stream:
                    # 检查是否被中断
                    if not self.active_streams.get(stream_id, False):
                        yield StreamChunk(type="error", error="对话已被中断")
                        return

                    if isinstance(item, ModelClientStreamingChunkEvent):
                        content = item.content or ""

                        if content:  # 只处理非空内容
                            # 直接累积原始内容，不在流式过程中进行复杂去重
                            assistant_content += content

                            # 只进行基础的单字符去重，避免破坏流式体验
                            cleaned_content = self._basic_clean_chunk(content)

                            if cleaned_content:  # 只发送清理后的非空内容
                                yield StreamChunk(
                                    type="content",
                                    content=cleaned_content,
                                    conversation_id=conversation_id
                                )
                
                # 对完整内容进行最终去重处理
                final_content = self._deep_clean_content(assistant_content)

                # 保存助手回复
                assistant_message = ChatMessage(
                    role=MessageRole.ASSISTANT,
                    content=final_content,
                    timestamp=datetime.now(),
                    conversation_id=conversation_id
                )
                await db.save_message(assistant_message)

                # 如果是新对话的第一条消息，生成标题
                if is_new_conversation:
                    title = self._generate_conversation_title(message)
                    await db.update_conversation_title(conversation_id, title)

                # 发送完成信号
                yield StreamChunk(
                    type="done",
                    conversation_id=conversation_id
                )
            
            finally:
                # 清理活跃流和缓冲区
                self.active_streams.pop(stream_id, None)
                self.content_buffer.pop(stream_id, None)
        
        except Exception as e:
            yield StreamChunk(type="error", error=str(e))
    
    async def _build_conversation_context(
        self, 
        conversation_id: str, 
        current_message: str,
        use_search: bool
    ) -> str:
        """构建对话上下文"""
        context_parts = []
        
        # 获取历史对话
        history_messages = await db.get_conversation_messages(conversation_id)
        
        # 添加历史对话到上下文（最近10条）
        if history_messages:
            context_parts.append("对话历史：")
            for msg in history_messages[-10:]:  # 只取最近10条
                if msg.role == MessageRole.USER:
                    context_parts.append(f"用户: {msg.content}")
                elif msg.role == MessageRole.ASSISTANT:
                    context_parts.append(f"助手: {msg.content}")
        
        # 如果启用搜索，添加搜索结果
        if use_search:
            search_results = await search_service.search_web(current_message, max_results=3)
            if search_results:
                context_parts.append("\n相关搜索结果：")
                for i, result in enumerate(search_results, 1):
                    context_parts.append(f"{i}. {result.title}")
                    context_parts.append(f"   链接: {result.url}")
                    context_parts.append(f"   摘要: {result.snippet}")
                    context_parts.append("")
        
        # 添加当前问题
        context_parts.append(f"\n当前问题: {current_message}")
        
        return "\n".join(context_parts)
    
    def interrupt_stream(self, stream_id: str):
        """中断流式对话"""
        if stream_id in self.active_streams:
            self.active_streams[stream_id] = False
    
    async def get_conversation_history(self, conversation_id: str) -> List[ChatMessage]:
        """获取对话历史"""
        return await db.get_conversation_messages(conversation_id)
    
    async def get_conversations(self) -> List:
        """获取对话列表"""
        return await db.get_conversations()
    
    async def delete_conversation(self, conversation_id: str):
        """删除对话"""
        await db.delete_conversation(conversation_id)

    def _basic_clean_chunk(self, content: str) -> str:
        """基础清理单个chunk，只处理明显的重复"""
        if not content:
            return content

        import re

        # 只去除连续的相同字符（超过3个）
        cleaned = re.sub(r'(.)\1{3,}', r'\1', content)

        return cleaned

    def _clean_single_chunk(self, content: str) -> str:
        """清理单个流式chunk"""
        if not content:
            return content

        import re

        # 去除连续重复的字符（超过2个）
        cleaned = re.sub(r'(.)\1{2,}', r'\1', content)

        # 去除重复的标点符号
        cleaned = re.sub(r'([。！？，；：、\n])\1+', r'\1', cleaned)

        return cleaned

    def _deep_clean_content(self, content: str) -> str:
        """深度清理内容，去除各种重复"""
        if not content:
            return content

        import re

        # 1. 去除连续重复的字符
        cleaned = re.sub(r'(.)\1{2,}', r'\1\1', content)  # 最多保留2个重复字符

        # 2. 去除重复的中文词组（2-8个字符）
        cleaned = re.sub(r'([\u4e00-\u9fff]{2,8})\1+', r'\1', cleaned)

        # 3. 去除重复的英文单词
        cleaned = re.sub(r'(\b[a-zA-Z]+\b)\s*\1+', r'\1', cleaned)

        # 4. 去除重复的短语（包含空格的）
        cleaned = re.sub(r'([^\n。！？]{3,20})\1+', r'\1', cleaned)

        # 5. 处理行内重复（同一行内的重复内容）
        lines = cleaned.split('\n')
        processed_lines = []

        for line in lines:
            if line.strip():
                # 去除行内重复的短语
                line = re.sub(r'([^\s。！？，]{2,10})\s*\1+', r'\1', line)
                # 去除重复的句子片段
                line = re.sub(r'([^。！？]{5,30}[。！？])\s*\1+', r'\1', line)
            processed_lines.append(line)

        # 6. 去除重复的整行
        final_lines = []
        seen_lines = set()

        for line in processed_lines:
            line_normalized = re.sub(r'\s+', ' ', line.strip())
            if line_normalized:
                if line_normalized not in seen_lines:
                    seen_lines.add(line_normalized)
                    final_lines.append(line)
            else:
                final_lines.append(line)  # 保留空行

        result = '\n'.join(final_lines)

        # 7. 最终清理：去除多余的标点符号
        result = re.sub(r'([。！？，；：])\1+', r'\1', result)

        return result

    def _clean_streaming_content(self, content: str) -> str:
        """兼容性方法，调用深度清理"""
        return self._deep_clean_content(content)

    def _generate_conversation_title(self, first_message: str) -> str:
        """根据第一条消息生成对话标题"""
        # 简单的标题生成逻辑
        message = first_message.strip()

        # 如果消息太长，截取前20个字符
        if len(message) > 20:
            title = message[:20] + "..."
        else:
            title = message

        # 移除换行符和多余空格
        title = ' '.join(title.split())

        # 如果标题为空，使用默认标题
        if not title:
            title = f"对话 {datetime.now().strftime('%m-%d %H:%M')}"

        return title

# 全局聊天服务实例
chat_service = ChatService()
