#!/usr/bin/env python3
"""
简单测试脚本
"""

import asyncio
import httpx
import json

async def simple_test():
    """简单测试"""
    print("🧪 简单测试...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 测试健康检查
            health = await client.get("http://localhost:8000/api/health")
            print(f"健康检查: {health.status_code}")
            
            # 测试流式聊天
            chat_data = {
                "message": "你好",
                "use_search": False
            }
            
            print("发送聊天请求...")
            response = await client.post("http://localhost:8000/api/chat/stream", json=chat_data)
            print(f"响应状态: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            
            if response.status_code == 200:
                content = await response.aread()
                print(f"响应内容: {content[:500]}...")
            
        except Exception as e:
            print(f"错误: {e}")

if __name__ == "__main__":
    asyncio.run(simple_test())
