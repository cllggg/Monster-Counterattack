from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    phone = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profiles = relationship("StudentProfile", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    current_monster_id = Column(String, default="1")
    total_exp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    atk = Column(Integer, default=10)
    def_val = Column(Integer, default=10)
    per = Column(Integer, default=10)
    quest_stage = Column(String, default="ready")
    avatar_url = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profiles")
    learning_logs = relationship("LearningLog", back_populates="student")
    behavior_logs = relationship("UserBehaviorLog", back_populates="student")
    mistakes = relationship("ErrorBank", back_populates="student")

class UserBehaviorLog(Base):
    __tablename__ = "behavior_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("student_profiles.id"))
    action_type = Column(String)
    duration = Column(Integer, default=0)
    context = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("StudentProfile", back_populates="behavior_logs")

class LearningLog(Base):
    __tablename__ = "learning_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("student_profiles.id"))
    kp_code = Column(String)
    is_correct = Column(Boolean)
    exp_gained = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("StudentProfile", back_populates="learning_logs")

class ErrorBank(Base):
    __tablename__ = "error_bank"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("student_profiles.id"))
    kp_code = Column(String)
    error_tag = Column(String)
    original_question = Column(Text)
    wrong_answer = Column(Text)
    next_review_date = Column(String) # Keeping as string for simplicity, could be DateTime

    student = relationship("StudentProfile", back_populates="mistakes")

class ReadingArticle(Base):
    __tablename__ = "reading_articles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String)
    author = Column(String, nullable=True)
    difficulty = Column(Integer, default=1)
    content = Column(JSON) # List of paragraphs: [{id, content, task, answer}]
    puzzle_segments = Column(JSON, nullable=True) # List of puzzle pieces for R3
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StudentReadingProgress(Base):
    __tablename__ = "reading_progress"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("student_profiles.id"))
    article_id = Column(String, ForeignKey("reading_articles.id"))
    current_paragraph_index = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    student = relationship("StudentProfile")
    article = relationship("ReadingArticle")

class DuelRecord(Base):
    __tablename__ = "duel_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("student_profiles.id"))
    stage_id = Column(String)
    score = Column(Integer)
    duration = Column(Integer)
    replay_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("StudentProfile")
