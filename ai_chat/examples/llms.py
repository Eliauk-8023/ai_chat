import os

from autogen_core.models import ModelFamily
from autogen_ext.models.openai import OpenAIChatCompletionClient
from dotenv import load_dotenv

#  加载环境变量
load_dotenv()

def get_model_client():
    openai_model_client = OpenAIChatCompletionClient(
        model=os.getenv("MODEL", "deepseek-chat"),
        base_url=os.getenv("BASE_URL", "https://api.deepseek.com/v1"),
        api_key=os.getenv("API_KEY"),
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": ModelFamily.UNKNOWN,
            "structured_output": True,
            "multiple_system_messages": True,
        }
    )
    return openai_model_client

# 单例设计模式
model_client = get_model_client()
