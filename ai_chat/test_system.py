#!/usr/bin/env python3
"""
智能AI聊天系统测试脚本
"""

import asyncio
import httpx
import json
from datetime import datetime

async def test_backend_api():
    """测试后端API功能"""
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print("🧪 开始测试后端API...")
        
        # 1. 测试健康检查
        print("\n1. 测试健康检查...")
        try:
            response = await client.get(f"{base_url}/api/health")
            if response.status_code == 200:
                print("✅ 健康检查通过")
                print(f"   响应: {response.json()}")
            else:
                print(f"❌ 健康检查失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 健康检查异常: {e}")
            return False
        
        # 2. 测试获取对话列表
        print("\n2. 测试获取对话列表...")
        try:
            response = await client.get(f"{base_url}/api/conversations")
            if response.status_code == 200:
                conversations = response.json()
                print(f"✅ 获取对话列表成功，共 {len(conversations)} 个对话")
            else:
                print(f"❌ 获取对话列表失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 获取对话列表异常: {e}")
        
        # 3. 测试搜索功能
        print("\n3. 测试搜索功能...")
        try:
            search_data = {
                "query": "Python编程",
                "max_results": 3
            }
            response = await client.post(f"{base_url}/api/search", json=search_data)
            if response.status_code == 200:
                results = response.json()
                print(f"✅ 搜索功能正常，找到 {len(results)} 个结果")
                for i, result in enumerate(results[:2], 1):
                    print(f"   {i}. {result.get('title', 'N/A')}")
            else:
                print(f"❌ 搜索功能失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 搜索功能异常: {e}")
        
        # 4. 测试流式聊天（简单测试）
        print("\n4. 测试流式聊天接口...")
        try:
            chat_data = {
                "message": "你好，请简单介绍一下你自己",
                "use_search": False
            }
            response = await client.post(f"{base_url}/api/chat/stream", json=chat_data)
            if response.status_code == 200:
                print("✅ 流式聊天接口响应正常")
                print("   注意：完整的流式测试需要在前端界面进行")
            else:
                print(f"❌ 流式聊天接口失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 流式聊天接口异常: {e}")
        
        print("\n🎉 后端API测试完成！")
        return True

def test_frontend_access():
    """测试前端访问"""
    print("\n🌐 测试前端访问...")
    
    import subprocess
    import time
    
    try:
        # 尝试访问前端页面
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3000"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout == "200":
            print("✅ 前端页面访问正常")
            print("   请在浏览器中访问: http://localhost:3000")
            return True
        else:
            print(f"❌ 前端页面访问失败，HTTP状态码: {result.stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ 前端页面访问超时")
        return False
    except Exception as e:
        print(f"❌ 前端页面访问异常: {e}")
        return False

def check_environment():
    """检查环境配置"""
    print("🔧 检查环境配置...")
    
    import os
    
    # 检查后端环境变量
    env_file = "backend/.env"
    if os.path.exists(env_file):
        print("✅ 后端环境配置文件存在")
        
        # 读取并检查关键配置
        with open(env_file, 'r') as f:
            content = f.read()
            if "API_KEY=" in content and "BASE_URL=" in content:
                print("✅ 关键环境变量已配置")
            else:
                print("⚠️  请检查API_KEY和BASE_URL配置")
    else:
        print("❌ 后端环境配置文件不存在")
        print("   请创建 backend/.env 文件并配置API密钥")
        return False
    
    # 检查前端依赖
    if os.path.exists("frontend/node_modules"):
        print("✅ 前端依赖已安装")
    else:
        print("❌ 前端依赖未安装，请运行: cd frontend && npm install")
        return False
    
    # 检查后端依赖
    try:
        import fastapi
        import autogen_agentchat
        print("✅ 后端依赖已安装")
    except ImportError as e:
        print(f"❌ 后端依赖缺失: {e}")
        print("   请运行: cd backend && pip install -r requirements.txt")
        return False
    
    return True

async def main():
    """主测试函数"""
    print("🚀 智能AI聊天系统测试")
    print("=" * 50)
    
    # 1. 检查环境
    if not check_environment():
        print("\n❌ 环境检查失败，请先解决环境问题")
        return
    
    # 2. 测试后端API
    backend_ok = await test_backend_api()
    
    # 3. 测试前端访问
    frontend_ok = test_frontend_access()
    
    # 4. 总结
    print("\n" + "=" * 50)
    print("📊 测试结果总结:")
    print(f"   后端API: {'✅ 正常' if backend_ok else '❌ 异常'}")
    print(f"   前端访问: {'✅ 正常' if frontend_ok else '❌ 异常'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 系统测试通过！")
        print("\n📍 访问地址:")
        print("   前端界面: http://localhost:3000")
        print("   后端API: http://localhost:8000")
        print("   API文档: http://localhost:8000/docs")
        print("\n💡 使用提示:")
        print("   1. 在前端界面中输入问题开始对话")
        print("   2. 可以启用网络搜索获取实时信息")
        print("   3. 支持中断AI回复和重发消息")
        print("   4. 所有对话都会自动保存")
    else:
        print("\n❌ 系统测试失败，请检查服务状态")

if __name__ == "__main__":
    asyncio.run(main())
