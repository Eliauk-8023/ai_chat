import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from models import (
    ChatRequest, ChatResponse, ChatMessage, MessageRole,
    SearchRequest, ConversationSummary, StreamChunk
)
from chat_service import chat_service
from search_service import search_service
from database import db
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    await db.init_db()
    yield
    # 关闭时的清理工作（如果需要）

app = FastAPI(title="智能聊天系统", version="1.0.0", lifespan=lifespan)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """根路径"""
    return {"message": "智能聊天系统API"}

@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """流式聊天接口"""
    async def generate():
        async for chunk in chat_service.chat_stream(
            message=request.message,
            conversation_id=request.conversation_id,
            use_search=request.use_search
        ):
            # EventSourceResponse会自动添加"data: "前缀，所以只需要返回JSON字符串
            yield chunk.model_dump_json()

    return EventSourceResponse(generate())

@app.post("/api/chat/interrupt/{stream_id}")
async def interrupt_chat(stream_id: str):
    """中断聊天流"""
    chat_service.interrupt_stream(stream_id)
    return {"message": "聊天已中断"}

@app.get("/api/conversations")
async def get_conversations():
    """获取对话列表"""
    conversations = await chat_service.get_conversations()
    return conversations

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """获取对话消息"""
    messages = await chat_service.get_conversation_history(conversation_id)
    return messages

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """删除对话"""
    await chat_service.delete_conversation(conversation_id)
    return {"message": "对话已删除"}

@app.post("/api/search")
async def search_web(request: SearchRequest):
    """网络搜索接口"""
    results = await search_service.search_web(request.query, request.max_results)
    return results

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
