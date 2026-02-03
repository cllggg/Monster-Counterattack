from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# --- Core Data Models (PRD 6.0) ---

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    password_hash: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class StudentProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    current_monster_id: str = "1" # 1: 呆呆兽, 2: 灵光兽, etc.
    total_exp: int = 0
    level: int = 1
    atk: int = 10
    def_val: int = 10 # Defense
    per: int = 10 # Perception
    quest_stage: str = "ready"
    avatar_url: Optional[str] = None

class UserBehaviorLog(BaseModel):
    """用于分析用户卡点和行为习惯 (PRD 8.0)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    action_type: str # e.g., 'enter_module', 'click_help', 'submit_answer'
    duration: int = 0 # milliseconds spent
    context: Dict[str, Any] = {} # e.g., { "module": "F1", "question_id": "123" }
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class LearningLog(BaseModel):
    """用于记录学习结果和计算指标 (PRD 8.0)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    kp_code: str # Knowledge Point Code
    is_correct: bool
    exp_gained: int
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ErrorBank(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    kp_code: str
    error_tag: str # e.g., #粗心 #概念混淆
    original_question: str
    wrong_answer: str
    next_review_date: str

# --- API Request/Response Models ---

class DiagnoseRequest(BaseModel):
    student_id: str
    original_text: str
    modified_text: str
    error_type: Optional[str] = None

class DiagnoseResponse(BaseModel):
    is_correct: bool
    feedback_text: str
    exp_reward: int

class BossStartRequest(BaseModel):
    student_id: str
    stage_id: str

class BossStartResponse(BaseModel):
    boss_id: str
    questions_list: List[Dict[str, Any]]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None

class WritingRequest(BaseModel):
    messages: List[ChatMessage]
    topic: Optional[str] = None

class EvaluateRequest(BaseModel):
    draft: str
    topic: str

class HandwritingVerifyRequest(BaseModel):
    svg_path: str
    target_word: str

class UserStatsUpdate(BaseModel):
    exp: int
    level: int
    atk: int
    def_val: int
    per: int
    quest_stage: Optional[str] = "ready"

class ReadingArticle(BaseModel):
    id: Optional[str] = None
    title: str
    author: Optional[str] = None
    difficulty: int = 1
    content: List[Dict[str, Any]]
    puzzle_segments: Optional[List[Dict[str, Any]]] = None # For Logic Puzzle
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ReadingProgress(BaseModel):
    student_id: str
    article_id: str
    current_paragraph_index: int
    is_completed: bool

# --- Growth Atlas Models (PRD 3.6) ---

class GrowthRadarData(BaseModel):
    label: str
    value: int
    max_value: int = 100

class KnowledgeHeatmapData(BaseModel):
    date: str # YYYY-MM-DD
    count: int

class EvolutionTimelineItem(BaseModel):
    date: str
    title: str
    description: str
    type: str # 'level_up', 'achievement', 'evolution'

class GrowthAtlasResponse(BaseModel):
    radar_data: List[GrowthRadarData]
    heatmap_data: List[KnowledgeHeatmapData]
    timeline: List[EvolutionTimelineItem]
    potential_forecast: str

# --- Duel & Parent Models (User Request) ---

class DuelRecordCreate(BaseModel):
    student_id: str
    stage_id: str
    score: int
    duration: int
    replay_data: List[Dict[str, Any]]

class DuelRecordResponse(BaseModel):
    id: str
    student_name: str
    monster_avatar: Optional[str]
    score: int
    duration: int
    replay_data: List[Dict[str, Any]]
    created_at: str

class ParentWeeklyReport(BaseModel):
    student_name: str
    total_study_time: int # minutes
    total_exp_gained: int
    daily_stats: List[Dict[str, Any]] # [{date: 'Mon', value: 10}, ...]
    weak_points: List[str]
    suggestions: str
