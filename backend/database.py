import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Optional
from models import ChatMessage, ConversationSummary, MessageRole
import aiosqlite

class ChatDatabase:
    def __init__(self, db_path: str = "chat_history.db"):
        self.db_path = db_path
    
    async def init_db(self):
        """初始化数据库表"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
                )
            """)
            
            await db.commit()
    
    async def create_conversation(self, title: str = "新对话") -> str:
        """创建新对话"""
        conversation_id = str(uuid.uuid4())
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO conversations (id, title) VALUES (?, ?)",
                (conversation_id, title)
            )
            await db.commit()
        return conversation_id
    
    async def save_message(self, message: ChatMessage) -> str:
        """保存消息"""
        if not message.id:
            message.id = str(uuid.uuid4())
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO messages (id, conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
                (message.id, message.conversation_id, message.role.value, message.content, message.timestamp or datetime.now())
            )
            await db.commit()
        
        return message.id
    
    async def get_conversation_messages(self, conversation_id: str) -> List[ChatMessage]:
        """获取对话的所有消息"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT id, role, content, timestamp FROM messages WHERE conversation_id = ? ORDER BY timestamp",
                (conversation_id,)
            ) as cursor:
                messages = []
                async for row in cursor:
                    messages.append(ChatMessage(
                        id=row[0],
                        role=MessageRole(row[1]),
                        content=row[2],
                        timestamp=datetime.fromisoformat(row[3]) if row[3] else None,
                        conversation_id=conversation_id
                    ))
                return messages
    
    async def get_conversations(self, limit: int = 50) -> List[ConversationSummary]:
        """获取对话列表"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT c.id, c.title, c.updated_at,
                       (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
                       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
                       (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message_time
                FROM conversations c
                ORDER BY c.updated_at DESC
                LIMIT ?
            """, (limit,)) as cursor:
                conversations = []
                async for row in cursor:
                    # 使用最后一条消息的时间，如果没有则使用对话更新时间
                    last_time = row[5] if row[5] else row[2]
                    try:
                        if last_time:
                            timestamp = datetime.fromisoformat(last_time.replace('Z', '+00:00'))
                        else:
                            timestamp = datetime.now()
                    except (ValueError, AttributeError):
                        timestamp = datetime.now()

                    conversations.append(ConversationSummary(
                        id=row[0],
                        title=row[1] or f"对话 {timestamp.strftime('%m-%d %H:%M')}",
                        timestamp=timestamp,
                        last_message=row[3] or "",
                        message_count=row[4] or 0
                    ))
                return conversations
    
    async def update_conversation_title(self, conversation_id: str, title: str):
        """更新对话标题"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (title, conversation_id)
            )
            await db.commit()
    
    async def delete_conversation(self, conversation_id: str):
        """删除对话"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            await db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
            await db.commit()

# 全局数据库实例
db = ChatDatabase()
