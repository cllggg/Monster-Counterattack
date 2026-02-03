import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

SYSTEM_PROMPT = """
你是一位专门辅助小学生进行语文阅读理解的“苏格拉底式”AI教练。
你的任务是引导学生深入思考，而不是直接给出答案。

遵循以下三步法：
1. 启发 (Inspire)：当学生提问时，先肯定他们的思考，然后抛出一个引导性问题。
2. 推导 (Deduce)：引导学生从原文中寻找线索，利用“证据”来支撑观点。
3. 解析 (Analyze)：在学生得出结论后，进行升华总结，解释背后的文学常识或逻辑。

语气要求：
- 亲切、鼓励，像一个睿智的大哥哥/大姐姐。
- 使用简单的词汇，适合 8-12 岁儿童。
- 适当使用 emoji 增加互动感。

约束：
- 严禁直接给出阅读理解题目的标准答案。
- 每次回复不超过 150 字。
"""

async def diagnose_sentence_ai(original_text, modified_text):
    prompt = f"""
    你是一个小学语文病句诊断专家。
    学生正在尝试修改病句。
    
    原句：{original_text}
    学生修改后的句子：{modified_text}
    
    请判断：
    1. 修改后的句子是否通顺且逻辑正确？
    2. 是否解决了原句的语病？
    
    返回 JSON 格式：
    {{
        "is_correct": true/false,
        "feedback_text": "你的具体点评（针对小学生的鼓励性语言）",
        "exp_reward": 10-20 (根据修改质量给出)
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={'type': 'json_object'}
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Diagnose Error: {e}")
        return None

async def polish_writing_ai(text):
    prompt = f"""
    你是一个小学作文润色师。请阅读以下段落，找出其中的“高光时刻”（好词好句），并对干瘪的句子提供“扩句”建议。
    
    文章内容：
    {text}
    
    返回 JSON 格式：
    {{
        "highlights": ["好句1", "好词1"],
        "suggestions": [
            {{ "original": "原句片段", "suggestion": "扩句建议" }}
        ],
        "comment": "整体点评"
    }}
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={'type': 'json_object'}
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Polish Error: {e}")
        return None

async def generate_growth_forecast_ai(stats_summary, learning_summary):
    prompt = f"""
    你是一个小学语文学习专家。请根据学生的各项属性和近期学习记录，给出一个“潜力预测”和下一步训练建议。
    
    学生属性：
    - 攻击力(写作): {stats_summary.get('atk')}
    - 防御力(基础): {stats_summary.get('def_val')}
    - 感知力(阅读): {stats_summary.get('per')}
    - 等级: {stats_summary.get('level')}
    
    近期学习记录：
    {learning_summary}
    
    请给出一个 100 字以内的鼓励性预测报告，包含“强势区”与“待开发区”的分析。
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Forecast Error: {e}")
        return "你的怪兽正在积蓄能量，保持专注，很快就能看到惊人的进步！"

async def get_ai_response(messages, context=None):
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if context:
        full_messages.append({"role": "system", "content": f"当前阅读的文章背景：\n{context}"})
    
    # Add conversation history
    for msg in messages:
        full_messages.append({"role": msg.role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=full_messages,
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Error: {e}")
        return "哎呀，我的能量核有点闪烁，你能再跟我说一遍吗？✨"
