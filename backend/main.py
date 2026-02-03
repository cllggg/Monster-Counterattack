from fastapi import FastAPI, HTTPException, APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Any, Dict
import os
import json
import asyncio
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
import edge_tts
import tempfile

# Import models (Pydantic)
from models import (
    User as PydanticUser, StudentProfile as PydanticStudentProfile, 
    UserBehaviorLog as PydanticUserBehaviorLog, LearningLog as PydanticLearningLog, 
    ErrorBank as PydanticErrorBank,
    DiagnoseRequest, DiagnoseResponse, BossStartRequest, BossStartResponse,
    ChatRequest, WritingRequest, EvaluateRequest, HandwritingVerifyRequest,
    UserStatsUpdate, ChatMessage,
    ReadingArticle as PydanticReadingArticle, ReadingProgress as PydanticReadingProgress
)
import models
import db_models
from database import engine, Base, get_db, AsyncSessionLocal

# Import AI logic
from ai_coach import get_ai_response, polish_writing_ai, generate_growth_forecast_ai, diagnose_sentence_ai
from writing_pilot import get_writing_guidance, evaluate_writing
from handwriting import recognize_handwriting

load_dotenv()

app = FastAPI(title="Monster Counterattack API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialization ---
@app.on_event("startup")
async def startup_event():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Ensure default user exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(db_models.User).where(db_models.User.id == "default_user"))
        user = result.scalars().first()
        if not user:
            new_user = db_models.User(id="default_user", phone="13800138000", password_hash="hashed_secret")
            session.add(new_user)
            await session.commit()

# --- AI Fallback Logic ---
async def safe_ai_call(coroutine, fallback_response):
    try:
        return await asyncio.wait_for(coroutine, timeout=5.0)
    except asyncio.TimeoutError:
        print("AI Timeout - Falling back to standard response")
        return fallback_response
    except Exception as e:
        print(f"AI Error: {e} - Falling back")
        return fallback_response

# --- API V1 Router ---
v1_router = APIRouter(prefix="/v1")

@v1_router.get("/")
async def root():
    return {"message": "Monster Counterattack API v1 (PostgreSQL)"}

# --- Foundation Module API ---
@v1_router.post("/foundation/sentence/diagnose", response_model=DiagnoseResponse)
async def diagnose_sentence(request: DiagnoseRequest):
    async def _call_ai():
        result_json_str = await diagnose_sentence_ai(request.original_text, request.modified_text)
        if result_json_str:
             try:
                 result = json.loads(result_json_str)
                 return DiagnoseResponse(
                     is_correct=result.get("is_correct", False),
                     feedback_text=result.get("feedback_text", "AI正在思考中..."),
                     exp_reward=result.get("exp_reward", 0)
                 )
             except:
                 pass
        return None

    fallback = DiagnoseResponse(
        is_correct=True, 
        feedback_text="网络繁忙，但你的修改看起来很有尝试精神！(Fallback)", 
        exp_reward=10
    )
    
    async def _safe_wrapper():
        res = await _call_ai()
        if res is None:
             raise Exception("AI returned None")
        return res

    return await safe_ai_call(_safe_wrapper(), fallback)

@v1_router.post("/foundation/handwriting/verify")
async def verify_handwriting_api(request: HandwritingVerifyRequest):
    return await recognize_handwriting(request.svg_path, request.target_word)

# --- Game & Boss API ---
@v1_router.post("/game/boss/start", response_model=BossStartResponse)
async def start_boss_battle(request: BossStartRequest):
    return BossStartResponse(
        boss_id=f"boss_{request.stage_id}",
        questions_list=[
            {"id": "q1", "type": "choice", "content": "选出正确的词语：( ) 论", "options": ["辨", "辩"], "answer": "辩"},
            {"id": "q2", "type": "text", "content": "修改病句：他穿着一件红色的上衣和一顶帽子。", "answer": "他穿着一件红色的上衣，戴着一顶帽子。"}
        ]
    )

# --- Social & Leaderboard API ---
@v1_router.get("/social/leaderboard")
async def get_leaderboard(type: str = "exp", scope: str = "global", db: AsyncSession = Depends(get_db)):
    from sqlalchemy import desc, func
    from datetime import datetime, timedelta

    if type == "momentum":
        # 计算过去7天的总经验增长
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        # 聚合 LearningLog
        subquery = (
            select(
                db_models.LearningLog.student_id,
                func.sum(db_models.LearningLog.exp_gained).label("total_momentum")
            )
            .where(db_models.LearningLog.timestamp >= seven_days_ago)
            .group_by(db_models.LearningLog.student_id)
            .subquery()
        )
        
        query = (
            select(db_models.StudentProfile, subquery.c.total_momentum)
            .join(subquery, db_models.StudentProfile.user_id == subquery.c.student_id)
            .order_by(desc(subquery.c.total_momentum))
            .limit(10)
        )
        result = await db.execute(query)
        rows = result.all()
        
        leaderboard = []
        for index, (p, momentum) in enumerate(rows):
            leaderboard.append({
                "rank": index + 1,
                "name": p.name,
                "monster": "🐲" if p.level > 5 else "🦁" if p.level > 3 else "👾",
                "exp": momentum,
                "is_momentum": True
            })
        return leaderboard
    else:
        # 默认按总经验排序
        result = await db.execute(
            select(db_models.StudentProfile)
            .order_by(desc(db_models.StudentProfile.total_exp))
            .limit(10)
        )
        profiles = result.scalars().all()
        
        leaderboard = []
        for index, p in enumerate(profiles):
            leaderboard.append({
                "rank": index + 1,
                "name": p.name,
                "monster": "🐲" if p.level > 5 else "🦁" if p.level > 3 else "👾",
                "exp": p.total_exp,
                "is_momentum": False
            })
        return leaderboard

# --- AI & Writing API ---
@v1_router.post("/chat/completions")
async def chat_completion(request: ChatRequest):
    async def _call_ai():
        return await get_ai_response(request.messages, request.context)
        
    fallback = "怪兽的信号塔似乎有点干扰，我们稍后再试吧！(Timeout)"
    reply = await safe_ai_call(_call_ai(), fallback)
    return {"reply": reply}

@v1_router.post("/writing/guide")
async def writing_guide(request: WritingRequest):
    async def _call_writing():
        return await get_writing_guidance(request.messages, request.topic)
    
    fallback = "你的想法很有趣，试着多描述一下细节吧！(Timeout)"
    reply = await safe_ai_call(_call_writing(), fallback)
    return {"reply": reply}

@v1_router.post("/writing/evaluate")
async def writing_evaluate(request: EvaluateRequest):
    async def _call_eval():
        return await evaluate_writing(request.draft, request.topic)
    
    fallback = {"score": 80, "tips": ["网络波动，暂时无法提供详细点评，但你写得很认真！"]}
    return await safe_ai_call(_call_eval(), fallback)

@v1_router.post("/writing/polish")
async def writing_polish(request: EvaluateRequest):
    async def _call_polish():
        result_str = await polish_writing_ai(request.draft)
        if result_str:
             try:
                 return json.loads(result_str)
             except:
                 pass
        return None

    fallback = {
        "highlights": ["你写得很认真！"],
        "suggestions": [{"original": request.draft[:10]+"...", "suggestion": "可以试着加入更多细节哦"}],
        "comment": "网络繁忙，无法连接到魔法润色师。"
    }
    
    async def _safe_wrapper():
        res = await _call_polish()
        if res is None:
             raise Exception("AI returned None")
        return res
    
    return await safe_ai_call(_safe_wrapper(), fallback)

# --- Data Logging API ---
@v1_router.post("/log/behavior")
async def log_behavior(log: PydanticUserBehaviorLog, db: AsyncSession = Depends(get_db)):
    db_log = db_models.UserBehaviorLog(
        id=log.id,
        student_id=log.student_id,
        action_type=log.action_type,
        duration=log.duration,
        context=log.context,
        created_at=datetime.fromisoformat(log.created_at) if log.created_at else datetime.utcnow()
    )
    db.add(db_log)
    await db.commit()
    return {"status": "success"}

@v1_router.post("/log/learning")
async def log_learning(log: PydanticLearningLog, db: AsyncSession = Depends(get_db)):
    db_log = db_models.LearningLog(
        id=log.id,
        student_id=log.student_id,
        kp_code=log.kp_code,
        is_correct=log.is_correct,
        exp_gained=log.exp_gained,
        timestamp=datetime.fromisoformat(log.timestamp) if log.timestamp else datetime.utcnow()
    )
    db.add(db_log)
    await db.commit()
    return {"status": "success"}

@v1_router.post("/log/mistake")
async def log_mistake(mistake: PydanticErrorBank, db: AsyncSession = Depends(get_db)):
    db_mistake = db_models.ErrorBank(
        id=mistake.id,
        student_id=mistake.student_id,
        kp_code=mistake.kp_code,
        error_tag=mistake.error_tag,
        original_question=mistake.original_question,
        wrong_answer=mistake.wrong_answer,
        next_review_date=mistake.next_review_date
    )
    db.add(db_mistake)
    await db.commit()
    return {"status": "success"}

@v1_router.get("/log/mistakes")
async def get_mistakes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(db_models.ErrorBank))
    mistakes = result.scalars().all()
    return mistakes

@v1_router.delete("/log/mistakes")
async def clear_mistakes(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(db_models.ErrorBank))
    await db.commit()
    return {"status": "success"}

# --- User Stats Sync ---
@v1_router.get("/user/stats")
async def get_user_stats(db: AsyncSession = Depends(get_db)):
    # Explicitly query for default_user
    result = await db.execute(select(db_models.StudentProfile).where(db_models.StudentProfile.user_id == "default_user"))
    profile = result.scalars().first()
    
    if not profile:
        print("[DEBUG] No profile found for default_user, returning default")
        return {"exp": 0, "level": 1, "atk": 10, "def_val": 10, "per": 10, "quest_stage": "ready"}
        
    print(f"[DEBUG] get_user_stats: Returning profile - exp={profile.total_exp}, stage={profile.quest_stage}")
    return {
        "exp": profile.total_exp,
        "level": profile.level,
        "atk": profile.atk,
        "def_val": profile.def_val,
        "per": profile.per,
        "quest_stage": profile.quest_stage
    }

# ... (skip to update_user_stats)

@v1_router.post("/user/stats")
async def update_user_stats(stats: UserStatsUpdate, db: AsyncSession = Depends(get_db)):
    print(f"[DEBUG] update_user_stats called with: {stats}")
    # Explicitly query for default_user
    result = await db.execute(select(db_models.StudentProfile).where(db_models.StudentProfile.user_id == "default_user"))
    profile = result.scalars().first()
    
    if profile:
        print(f"[DEBUG] Updating existing profile for default_user. Old stage: {profile.quest_stage}, New stage: {stats.quest_stage}")
        
        # Log diff
        if profile.total_exp != stats.exp:
            print(f"[DIFF] EXP: {profile.total_exp} -> {stats.exp}")
        if profile.quest_stage != stats.quest_stage:
            print(f"[DIFF] Stage: {profile.quest_stage} -> {stats.quest_stage}")

        profile.total_exp = stats.exp
        profile.level = stats.level
        profile.atk = stats.atk
        profile.def_val = stats.def_val
        profile.per = stats.per
        if stats.quest_stage:
            profile.quest_stage = stats.quest_stage
        
        profile.updated_at = datetime.utcnow() # Update timestamp
        
        await db.commit()
        print("[DEBUG] Profile updated and committed.")
    else:
        print("[DEBUG] Creating new profile for default_user")
        new_profile = db_models.StudentProfile(
            user_id="default_user",
            name="Default Student",
            total_exp=stats.exp,
            level=stats.level,
            atk=stats.atk,
            def_val=stats.def_val,
            per=stats.per,
            quest_stage=stats.quest_stage or "ready",
            updated_at=datetime.utcnow()
        )
        db.add(new_profile)
        await db.commit()
        print("[DEBUG] New profile created and committed.")
    return {"status": "success"}

# --- Account & Identity API ---
@v1_router.get("/auth/profiles")
async def get_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(db_models.StudentProfile))
    profiles = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "avatar": p.avatar_url or "👾",
            "level": p.level,
            "lastActive": "刚刚",
            "user_id": p.user_id,
            "total_exp": p.total_exp,
            "atk": p.atk,
            "def_val": p.def_val,
            "per": p.per
        }
        for p in profiles
    ]

@v1_router.post("/auth/profiles")
async def create_profile(profile: PydanticStudentProfile, db: AsyncSession = Depends(get_db)):
    user_result = await db.execute(select(db_models.User).where(db_models.User.id == profile.user_id))
    if not user_result.scalars().first():
        new_user = db_models.User(id=profile.user_id, phone="unknown", password_hash="hash")
        db.add(new_user)

    db_profile = db_models.StudentProfile(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        current_monster_id=profile.current_monster_id,
        total_exp=profile.total_exp,
        level=profile.level,
        atk=profile.atk,
        def_val=profile.def_val,
        per=profile.per,
        avatar_url=profile.avatar_url
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    
    return {
        "id": db_profile.id,
        "name": db_profile.name,
        "avatar": db_profile.avatar_url or "👾",
        "level": db_profile.level,
        "lastActive": "刚刚",
        "user_id": db_profile.user_id,
        "total_exp": db_profile.total_exp,
        "atk": db_profile.atk,
        "def_val": db_profile.def_val,
        "per": db_profile.per
    }

@v1_router.delete("/auth/profiles/{profile_id}")
async def delete_profile(profile_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(db_models.StudentProfile).where(db_models.StudentProfile.id == profile_id))
    await db.commit()
    return {"status": "success"}

# --- Reading Module API ---
@v1_router.get("/reading/articles")
async def get_articles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(db_models.ReadingArticle))
    articles = result.scalars().all()
    return articles

@v1_router.get("/reading/articles/{article_id}")
async def get_article(article_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(db_models.ReadingArticle).where(db_models.ReadingArticle.id == article_id))
    article = result.scalars().first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@v1_router.get("/reading/progress/{article_id}")
async def get_reading_progress(article_id: str, student_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(db_models.StudentReadingProgress)
        .where(db_models.StudentReadingProgress.article_id == article_id)
        .where(db_models.StudentReadingProgress.student_id == student_id)
    )
    progress = result.scalars().first()
    
    if not progress:
        return {"current_paragraph_index": 0, "is_completed": False}
    return progress

@v1_router.post("/reading/progress/{article_id}/unlock")
async def unlock_paragraph(article_id: str, student_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    profile_result = await db.execute(select(db_models.StudentProfile).where(db_models.StudentProfile.id == student_id))
    if not profile_result.scalars().first():
        new_profile = db_models.StudentProfile(id=student_id, user_id="default_user", name="Student")
        db.add(new_profile)
        await db.commit()

    # Get or create progress
    result = await db.execute(
        select(db_models.StudentReadingProgress)
        .where(db_models.StudentReadingProgress.article_id == article_id)
        .where(db_models.StudentReadingProgress.student_id == student_id)
    )
    progress = result.scalars().first()
    
    if not progress:
        progress = db_models.StudentReadingProgress(
            student_id=student_id,
            article_id=article_id,
            current_paragraph_index=0
        )
        db.add(progress)
    
    progress.current_paragraph_index += 1
    progress.updated_at = datetime.utcnow()
    
    await db.commit()
    return {"status": "unlocked", "current_index": progress.current_paragraph_index}

@v1_router.post("/reading/progress/{article_id}/reset")
async def reset_reading_progress(article_id: str, student_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(db_models.StudentReadingProgress)
        .where(db_models.StudentReadingProgress.article_id == article_id)
        .where(db_models.StudentReadingProgress.student_id == student_id)
    )
    progress = result.scalars().first()
    
    if progress:
        progress.current_paragraph_index = 0
        progress.is_completed = False
        progress.updated_at = datetime.utcnow()
        await db.commit()
    
    return {"status": "reset", "current_index": 0}

# --- TTS & F1 Module API ---
@v1_router.get("/foundation/tts")
async def text_to_speech(text: str, voice: str = "zh-CN-XiaoxiaoNeural"):
    """
    Real TTS using Microsoft Edge TTS (free, high quality).
    """
    try:
        temp_dir = tempfile.gettempdir()
        filename = f"tts_{hash(text)}.mp3"
        output_path = os.path.join(temp_dir, filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        
        return FileResponse(output_path, media_type="audio/mpeg", filename="tts.mp3")
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Social Duel API ---
@v1_router.post("/social/duel/record", response_model=models.DuelRecordResponse)
async def save_duel_record(record: models.DuelRecordCreate, db: AsyncSession = Depends(get_db)):
    db_record = db_models.DuelRecord(
        student_id=record.student_id,
        stage_id=record.stage_id,
        score=record.score,
        duration=record.duration,
        replay_data=record.replay_data
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    
    student = await db.get(db_models.StudentProfile, record.student_id)
    
    return models.DuelRecordResponse(
        id=db_record.id,
        student_name=student.name if student else "Unknown",
        monster_avatar=student.current_monster_id if student else None,
        score=db_record.score,
        duration=db_record.duration,
        replay_data=db_record.replay_data,
        created_at=db_record.created_at.isoformat()
    )

@v1_router.get("/social/duel/match", response_model=models.DuelRecordResponse)
async def match_duel_opponent(stage_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(db_models.DuelRecord)
        .where(db_models.DuelRecord.stage_id == stage_id)
        .order_by(func.random())
        .limit(1)
    )
    record = result.scalars().first()
    
    if not record:
        return models.DuelRecordResponse(
            id="dummy",
            student_name="影子武士",
            monster_avatar="1",
            score=80,
            duration=60000,
            replay_data=[],
            created_at=datetime.now().isoformat()
        )
        
    student = await db.get(db_models.StudentProfile, record.student_id)
    return models.DuelRecordResponse(
        id=record.id,
        student_name=student.name if student else "Unknown",
        monster_avatar=student.current_monster_id if student else None,
        score=record.score,
        duration=record.duration,
        replay_data=record.replay_data,
        created_at=record.created_at.isoformat()
    )

# --- Parent Portal API ---
@v1_router.get("/parent/weekly_report", response_model=models.ParentWeeklyReport)
async def get_weekly_report(student_id: str, db: AsyncSession = Depends(get_db)):
    student = await db.get(db_models.StudentProfile, student_id)
    if not student:
        raise HTTPException(404, "Student not found")
        
    daily_stats = [
        {"date": "Mon", "value": 120, "time": 15},
        {"date": "Tue", "value": 150, "time": 20},
        {"date": "Wed", "value": 80, "time": 10},
        {"date": "Thu", "value": 200, "time": 25},
        {"date": "Fri", "value": 180, "time": 22},
        {"date": "Sat", "value": 300, "time": 40},
        {"date": "Sun", "value": 250, "time": 35},
    ]
    
    return models.ParentWeeklyReport(
        student_name=student.name,
        total_study_time=167,
        total_exp_gained=1280,
        daily_stats=daily_stats,
        weak_points=["易错字诊所", "阅读逻辑"],
        suggestions="本周表现优秀！但在‘辨’与‘辩’的区分上还有待加强，建议周末多玩一次‘找茬’游戏。"
    )

app.include_router(v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
