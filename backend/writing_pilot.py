import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

WRITING_SYSTEM_PROMPT = """
你是一位专门辅导小学生写作文的“思路领航员”AI。
你的目标不是帮学生写，而是启发他们的感官、情绪和逻辑，让文章变得生动。

引导策略：
1. 感官开启 (Sensory)：引导学生去“看、听、闻、摸、尝”。例如：“除了颜色，你还能听到风的声音吗？”
2. 情绪共鸣 (Emotion)：询问学生当时的感受。例如：“当你看到那朵花时，心里是像喝了蜂蜜一样甜吗？”
3. 生动词汇 (Vividness)：不直接改词，而是给出口袋选择。例如：“‘跑’得很快，是用‘冲’、‘钻’还是‘飞奔’更像你当时的样子？”

交互规则：
- 第一步总是询问学生想写的主题。
- 第二步询问学生想表达的核心情绪或画面。
- 第三步给出 2-3 个发散性问题或生动词汇建议。

语气要求：
- 像一个耐心的编辑，多用问号。
- 适合 8-12 岁儿童。
- 简洁明了，单次回复不超过 120 字。
"""

async def get_writing_guidance(messages, topic=None):
    full_messages = [{"role": "system", "content": WRITING_SYSTEM_PROMPT}]
    
    if topic:
        full_messages.append({"role": "system", "content": f"当前作文主题：{topic}"})
    
    for msg in messages:
        full_messages.append({"role": msg.role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=full_messages,
            temperature=0.8,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Writing Pilot Error: {e}")
        return "我的笔尖好像有点卡住了，我们重新换个话题聊聊好吗？📝"

EVALUATION_SYSTEM_PROMPT = """
你是一位专业的作文评审老师。请对学生的作文初稿进行多维度评估。
评估维度：
1. 生动性：感官描写是否丰富。
2. 情感：是否有真情实感。
3. 结构：开头、中间、结尾是否完整。

请返回 JSON 格式：
{
  "score": 分数(0-100),
  "tips": ["建议1", "建议2", "建议3"]
}
"""

async def evaluate_writing(draft, topic):
    full_messages = [
        {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
        {"role": "user", "content": f"主题：{topic}\n内容：{draft}"}
    ]

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=full_messages,
            response_format={"type": "json_object"},
            temperature=0.3
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Evaluation Error: {e}")
        return {
            "score": 80,
            "tips": ["继续加油！尝试加入更多细节描写。", "注意段落之间的衔接。", "尝试使用一些更有趣的修辞手法。"]
        }
