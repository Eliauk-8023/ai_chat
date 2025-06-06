from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: MessageRole
    content: str
    timestamp: Optional[datetime] = None
    conversation_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    use_search: bool = False

class ChatResponse(BaseModel):
    message: ChatMessage
    conversation_id: str

class SearchRequest(BaseModel):
    query: str
    max_results: int = 5

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    last_message: str
    timestamp: datetime
    message_count: int

class StreamChunk(BaseModel):
    type: str  # "content", "done", "error"
    content: Optional[str] = None
    conversation_id: Optional[str] = None
    error: Optional[str] = None
