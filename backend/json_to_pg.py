import asyncio
import json
import os
from sqlalchemy import select
from database import AsyncSessionLocal, engine, Base
import db_models
from datetime import datetime

DATA_DIR = "data"

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

async def migrate_users_and_profiles():
    async with AsyncSessionLocal() as session:
        # 1. Profiles & Users
        profiles_data = load_json("profiles.json")
        if not profiles_data:
            print("No profiles found in profiles.json")
            
        for p_data in profiles_data:
            # Ensure user exists
            user_id = p_data.get("user_id", "default_user")
            result = await session.execute(select(db_models.User).where(db_models.User.id == user_id))
            user = result.scalars().first()
            if not user:
                print(f"Creating user {user_id}")
                new_user = db_models.User(id=user_id, phone="unknown", password_hash="hash")
                session.add(new_user)
            
            # Check if profile exists
            p_id = p_data.get("id")
            result = await session.execute(select(db_models.StudentProfile).where(db_models.StudentProfile.id == p_id))
            profile = result.scalars().first()
            
            if not profile:
                print(f"Migrating profile {p_data.get('name')}")
                new_profile = db_models.StudentProfile(
                    id=p_id,
                    user_id=user_id,
                    name=p_data.get("name"),
                    current_monster_id=p_data.get("current_monster_id", "1"),
                    total_exp=p_data.get("total_exp", 0),
                    level=p_data.get("level", 1),
                    atk=p_data.get("atk", 10),
                    def_val=p_data.get("def_val", 10),
                    per=p_data.get("per", 10),
                    avatar_url=p_data.get("avatar") # Map avatar to avatar_url
                )
                session.add(new_profile)
        
        await session.commit()

async def migrate_logs():
    async with AsyncSessionLocal() as session:
        # 2. Behavior Logs
        logs = load_json("behavior_logs.json")
        for log in logs:
            log_id = log.get("id")
            if not log_id: continue # Skip invalid logs
            
            result = await session.execute(select(db_models.UserBehaviorLog).where(db_models.UserBehaviorLog.id == log_id))
            if not result.scalars().first():
                new_log = db_models.UserBehaviorLog(
                    id=log_id,
                    student_id=log.get("student_id"),
                    action_type=log.get("action_type"),
                    duration=log.get("duration", 0),
                    context=log.get("context", {}),
                    created_at=datetime.fromisoformat(log.get("created_at")) if log.get("created_at") else datetime.utcnow()
                )
                session.add(new_log)

        # 3. Learning Logs
        logs = load_json("learning_logs.json")
        for log in logs:
            log_id = log.get("id")
            if not log_id: continue
            
            result = await session.execute(select(db_models.LearningLog).where(db_models.LearningLog.id == log_id))
            if not result.scalars().first():
                new_log = db_models.LearningLog(
                    id=log_id,
                    student_id=log.get("student_id"),
                    kp_code=log.get("kp_code"),
                    is_correct=log.get("is_correct"),
                    exp_gained=log.get("exp_gained"),
                    timestamp=datetime.fromisoformat(log.get("timestamp")) if log.get("timestamp") else datetime.utcnow()
                )
                session.add(new_log)

        # 4. Mistakes
        mistakes = load_json("mistakes.json")
        for m in mistakes:
            m_id = m.get("id")
            if not m_id: continue
            
            result = await session.execute(select(db_models.ErrorBank).where(db_models.ErrorBank.id == m_id))
            if not result.scalars().first():
                new_m = db_models.ErrorBank(
                    id=m_id,
                    student_id=m.get("student_id"),
                    kp_code=m.get("kp_code"),
                    error_tag=m.get("error_tag"),
                    original_question=m.get("original_question"),
                    wrong_answer=m.get("wrong_answer"),
                    next_review_date=m.get("next_review_date")
                )
                session.add(new_m)
        
        await session.commit()
        print("Migration completed.")

async def main():
    print("Starting migration...")
    try:
        # Ensure tables exist
        print("Creating tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")
        
        await migrate_users_and_profiles()
        print("Users/Profiles migrated.")
        await migrate_logs()
        print("Logs migrated.")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Migration failed: {e}")
