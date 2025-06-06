import httpx
import asyncio
from typing import List
from bs4 import BeautifulSoup
from models import SearchResult
import urllib.parse

class SearchService:
    def __init__(self):
        self.timeout = httpx.Timeout(10.0)
    
    async def search_web(self, query: str, max_results: int = 5) -> List[SearchResult]:
        """执行网络搜索"""
        try:
            # 使用DuckDuckGo搜索API (免费且无需API key)
            search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(search_url, headers=headers)
                response.raise_for_status()
                
                return self._parse_duckduckgo_results(response.text, max_results)
        
        except Exception as e:
            print(f"搜索错误: {e}")
            return []
    
    def _parse_duckduckgo_results(self, html: str, max_results: int) -> List[SearchResult]:
        """解析DuckDuckGo搜索结果"""
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        seen_urls = set()  # 用于去重

        # 查找搜索结果
        result_elements = soup.find_all('div', class_='result')

        for element in result_elements:
            if len(results) >= max_results:
                break

            try:
                # 提取标题和链接
                title_element = element.find('a', class_='result__a')
                if not title_element:
                    continue

                title = title_element.get_text(strip=True)
                url = title_element.get('href', '')

                # 去重检查
                if url in seen_urls or not url or not title:
                    continue
                seen_urls.add(url)

                # 提取摘要
                snippet_element = element.find('a', class_='result__snippet')
                snippet = snippet_element.get_text(strip=True) if snippet_element else ""

                # 清理摘要文本，去除重复内容
                snippet = self._clean_snippet(snippet)

                results.append(SearchResult(
                    title=title,
                    url=url,
                    snippet=snippet
                ))

            except Exception as e:
                print(f"解析搜索结果错误: {e}")
                continue

        return results

    def _clean_snippet(self, snippet: str) -> str:
        """清理摘要文本，去除重复内容"""
        if not snippet:
            return ""

        # 首先去除明显的重复字符模式
        import re

        # 去除连续重复的字符或词组
        # 匹配重复的字符或词组，如 "很高兴很高兴" -> "很高兴"
        snippet = re.sub(r'(.{1,10})\1+', r'\1', snippet)

        # 去除重复的标点符号
        snippet = re.sub(r'([。！？，；：])\1+', r'\1', snippet)

        # 分割成句子并去重
        sentences = []
        for sep in ['。', '！', '？']:
            if sep in snippet:
                parts = snippet.split(sep)
                for i, part in enumerate(parts[:-1]):  # 最后一个可能是空的
                    if part.strip():
                        sentences.append(part.strip() + sep)
                if parts[-1].strip():  # 处理最后一部分
                    sentences.append(parts[-1].strip())
                break
        else:
            # 如果没有句号等分隔符，按逗号分割
            sentences = [s.strip() for s in snippet.split('，') if s.strip()]

        # 去除重复句子
        unique_sentences = []
        seen_content = set()

        for sentence in sentences:
            # 简化句子用于比较（去除标点和空格）
            simplified = re.sub(r'[^\w]', '', sentence)
            if simplified and simplified not in seen_content and len(sentence) > 2:
                seen_content.add(simplified)
                unique_sentences.append(sentence)

        # 重新组合，限制长度
        if unique_sentences:
            result = '，'.join(unique_sentences)
            # 确保以合适的标点结尾
            if not result.endswith(('。', '！', '？', '，')):
                result += '。'
        else:
            result = snippet[:100] if len(snippet) > 100 else snippet

        # 最终长度限制
        if len(result) > 200:
            result = result[:200] + "..."

        return result
    
    async def get_page_content(self, url: str, max_length: int = 2000) -> str:
        """获取网页内容摘要"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 移除脚本和样式标签
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # 提取文本内容
                text = soup.get_text()
                
                # 清理文本
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
                
                # 截断到指定长度
                return text[:max_length] + "..." if len(text) > max_length else text
        
        except Exception as e:
            print(f"获取网页内容错误: {e}")
            return ""

# 全局搜索服务实例
search_service = SearchService()
