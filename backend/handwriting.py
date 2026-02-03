import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

# 这是一个专门用于手写轨迹识别的 Prompt
HANDWRITING_PROMPT = """
你是一个手写轨迹分析专家。你会收到一个由 SVG Path 格式表示的手写轨迹。
你的任务是：
1. 分析这些轨迹最可能代表的汉字。
2. 将识别出的汉字与目标汉字进行比对。
3. 判定是否匹配。

SVG Path 坐标说明：
- 'M x y' 表示起点。
- 'L x y' 表示连线。
- 坐标系通常是 400x300。

由于你无法直接看到图片，你需要根据笔画的走向、数量和结构来逻辑推断。
如果轨迹非常简单（例如只有一两笔，或者笔画极其短小），请判定为不匹配。

返回 JSON 格式：
{
  "recognized": "识别出的汉字",
  "is_match": true/false,
  "confidence": 0.0-1.0,
  "reason": "简短的判定理由"
}
"""

async def recognize_handwriting(svg_path: str, target_word: str):
    try:
        # 如果轨迹太短，直接判定失败，节省 API 调用
        if len(svg_path) < 50:
            return {
                "recognized": "未知",
                "is_match": False,
                "confidence": 0,
                "reason": "轨迹过短，无法构成有效汉字"
            }

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": HANDWRITING_PROMPT},
                {"role": "user", "content": f"目标汉字：'{target_word}'\n手写轨迹数据：\n{svg_path}"}
            ],
            temperature=0.1, # 使用低随机性确保识别稳定
            response_format={'type': 'json_object'}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Handwriting Recognition Error: {e}")
        # 兜底方案：如果 API 出错，采用简单的长度校验，防止“随便写写也能过”
        # 至少要有一定的轨迹长度
        is_basic_match = len(svg_path) > 100
        return {
            "recognized": "API Error",
            "is_match": is_basic_match,
            "confidence": 0.5,
            "reason": "服务暂时不可用，执行基础长度校验"
        }
