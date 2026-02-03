import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sword, Shield, Eye, MessageCircle, PenTool, Search, Scissors, RefreshCcw, UserCircle, XCircle, Plus, BookOpen, Map, Zap, Clock, Trophy, Settings, Users, ChevronRight, ArrowLeft } from 'lucide-react';

// Core Modules
import FoundationTerminal from './components/FoundationTerminal';
import MistForest from './components/MistForest';
import MagicWorkshop from './components/MagicWorkshop';
import TimeMachine from './components/TimeMachine';
import HeroHall from './components/HeroHall';
import TimePortal from './components/TimePortal';
import GrowthAtlas from './components/GrowthAtlas';
import RadioStation from './components/RadioStation';
import ShadowDuel from './components/ShadowDuel';
import ParentHub from './components/ParentHub';

// Sub-features
import DictationBot from './components/DictationBot';
import WordMatching from './components/WordMatching';
import ReadingCoach from './components/ReadingCoach';
import WritingPilot from './components/WritingPilot';
import TypoClinic from './components/TypoClinic';
import SentenceSurgery from './components/SentenceSurgery';
import ErrorCrush from './components/ErrorCrush';
import { api, useOfflineSync } from './services/api';

type View = 'profile_select' | 'home' 
  | 'foundation' | 'mist_forest' | 'magic_workshop' | 'time_machine' | 'hero_hall' | 'time_portal' | 'growth'
  | 'dictation' | 'matching' | 'reading' | 'writing' | 'typo' | 'surgery' | 'crush'
  | 'radio' | 'duel' | 'parent' | 'boss_battle' | 'summary';

type QuestStage = 'profile' | 'ready' | 'foundation_done' | 'forest_done' | 'time_machine_done' | 'boss_ready' | 'evolved' | 'completed';
type MonsterType = 'daidai' | 'lingguang';

const ModuleCard = ({ onClick, icon, title, sub, variant, delay, description }: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  title: string; 
  sub: string;
  variant: 'foundation' | 'forest' | 'magic' | 'time' | 'hall' | 'portal';
  delay: number;
  description?: string;
}) => {
  const getTheme = () => {
    switch (variant) {
      case 'foundation': return 'from-blue-600 via-blue-500 to-cyan-400 border-white/20 shadow-blue-500/30';
      case 'forest': return 'from-emerald-600 via-emerald-500 to-teal-400 border-white/20 shadow-emerald-500/30';
      case 'magic': return 'from-violet-600 via-purple-500 to-fuchsia-400 border-white/20 shadow-purple-500/30';
      case 'time': return 'from-rose-600 via-red-500 to-orange-400 border-white/20 shadow-red-500/30';
      case 'hall': return 'from-amber-500 via-yellow-500 to-orange-300 border-white/20 shadow-amber-500/30';
      case 'portal': return 'from-indigo-600 via-slate-800 to-purple-900 border-white/20 shadow-indigo-500/30';
      default: return 'from-gray-500 to-gray-700 border-white/20 shadow-gray-500/30';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'foundation': return 'bg-blue-400/30';
      case 'forest': return 'bg-emerald-400/30';
      case 'magic': return 'bg-purple-400/30';
      case 'time': return 'bg-red-400/30';
      case 'hall': return 'bg-yellow-400/30';
      case 'portal': return 'bg-indigo-400/30';
      default: return 'bg-white/20';
    }
  };

  const getPattern = () => {
    switch (variant) {
      case 'foundation': // 能量回收站 - 电池/闪电感
        return {
          backgroundImage: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 20%),
            linear-gradient(90deg, transparent 45%, rgba(52, 211, 153, 0.3) 50%, transparent 55%),
            repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(52, 211, 153, 0.1) 10px, rgba(52, 211, 153, 0.1) 11px)
          `
        };
      case 'forest': // 迷雾森林 - 树木/迷雾感
        return {
          backgroundImage: `
            radial-gradient(ellipse at bottom, rgba(34, 197, 94, 0.3) 0%, transparent 70%),
            radial-gradient(circle at 20% 40%, rgba(255,255,255,0.1) 0%, transparent 30%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 30%)
          `
        };
      case 'magic': // 魔法工坊 - 星星/火花感
        return {
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
            repeating-conic-gradient(from 0deg, transparent 0deg, transparent 30deg, rgba(245, 158, 11, 0.1) 31deg, rgba(245, 158, 11, 0.1) 32deg)
          `
        };
      case 'time': // 时光回溯机 - 齿轮/时钟感
        return {
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 40%, rgba(99, 102, 241, 0.2) 41%, rgba(99, 102, 241, 0.2) 45%, transparent 46%),
            conic-gradient(from 0deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)
          `
        };
      case 'hall': // 英雄名人堂 - 勋章/光芒感
        return {
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 60%),
            linear-gradient(45deg, transparent 48%, rgba(236, 72, 153, 0.3) 50%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(236, 72, 153, 0.3) 50%, transparent 52%)
          `
        };
      case 'portal': // 时光传送门 - 漩涡/虫洞感
        return {
          backgroundImage: `
            repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 10px, rgba(139, 92, 246, 0.1) 11px, rgba(139, 92, 246, 0.1) 15px),
            conic-gradient(from 180deg at 50% 50%, transparent 0%, rgba(139, 92, 246, 0.2) 100%)
          `
        };
      default: return {};
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95, rotate: -1 }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.4)"
      }}
      onClick={onClick}
      className={`w-full aspect-square rounded-[1.5rem] md:rounded-[3rem] relative overflow-hidden group transition-all duration-500 bg-gradient-to-br ${getTheme()} border-[1.5px] shadow-xl`}
    >
      {/* Dynamic Background Pattern */}
      <div 
        className={`absolute inset-0 opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-700`}
        style={getPattern()}
      />
      
      {/* Inner Depth Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(255,255,255,0.15)] pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col justify-between p-2.5 md:p-8">
        <div className="flex justify-between items-start">
          <div className={`p-1.5 md:p-4 rounded-xl md:rounded-2xl ${getIconBg()} backdrop-blur-md shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-500`}>
            {React.cloneElement(icon as React.ReactElement, { 
              className: "w-4 h-4 md:w-8 md:h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]", 
              strokeWidth: 2.5 
            })}
          </div>
          <div className="text-right">
            <span className="text-[6px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-0.5 md:mb-1">Module</span>
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-xs font-black text-white/90 px-1.5 md:px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 shadow-sm">
                LV.{Math.floor(Math.random() * 10) + 1}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-1 md:mt-4 text-left">
          <div className="overflow-hidden">
            <h3 className="text-[12px] md:text-2xl font-black text-white mb-0.5 md:mb-1 drop-shadow-lg tracking-tight leading-none group-hover:translate-x-1 transition-transform duration-300">
              {title}
            </h3>
          </div>
          <p className="text-[8px] md:text-xs text-white/70 font-bold leading-tight md:leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {description || "探索神秘领域，开启你的进化之旅"}
          </p>
        </div>
      </div>
      
      {/* Glassy Border Overlay */}
      <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[3rem] border border-white/10 pointer-events-none" />
      
      {/* Interactive Shine Animation */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-20" />
      </div>

      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-50 pointer-events-none" />
    </motion.button>
  );
};

const MenuButton = ({ onClick, icon, label, sub, theme, variant }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  theme: 'light' | 'dark';
  variant?: 'growth' | 'parent';
}) => {
  const getVariantStyle = () => {
    if (variant === 'growth') return 'from-slate-900 via-gray-800 to-slate-900 border-indigo-500/50 text-white shadow-indigo-500/30';
    if (variant === 'parent') return 'from-orange-50 to-white border-orange-200 text-gray-800 shadow-orange-500/10';
    return theme === 'dark' ? 'from-gray-900 to-black text-white border-white/10' : 'from-white to-gray-50 text-gray-800 border-gray-100';
  };

  return (
    <motion.button
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex items-center justify-between transition-all relative overflow-hidden shadow-xl bg-gradient-to-r ${getVariantStyle()} border-2 group`}
    >
      {/* Texture Overlays */}
      {variant === 'growth' && (
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_11px)]" />
        </div>
      )}

      {variant === 'parent' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.1)_0%,transparent_50%)]" />
        </div>
      )}
      
      <div className="flex items-center space-x-3 md:space-x-6 z-10">
        <div className={`w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
          variant === 'growth' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 
          variant === 'parent' ? 'bg-orange-100 text-orange-600 border border-orange-200' :
          theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 md:w-6 md:h-6" })}
        </div>
        <div className="text-left">
          <h4 className="text-sm md:text-xl font-black tracking-tight">{label}</h4>
          <p className="text-[7px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{sub}</p>
        </div>
      </div>

      <div className="z-10 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
        <Zap className={`w-4 h-4 md:w-5 md:h-5 ${variant === 'growth' ? 'text-indigo-400' : 'text-orange-400'}`} />
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
    </motion.button>
  );
};

const ResonanceVisuals = ({ active }: { active: boolean }) => {
  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Full Screen Border Glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] border-[12px] border-yellow-400/20"
            style={{
              boxShadow: 'inset 0 0 100px rgba(255, 215, 0, 0.15), 0 0 50px rgba(255, 215, 0, 0.1)'
            }}
          />
          
          {/* Pulsing Corners */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.4, 0.8, 0.4], 
                scale: [1, 1.2, 1],
                rotate: i * 90
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="fixed w-32 h-32 pointer-events-none z-[101]"
              style={{
                top: i < 2 ? -20 : 'auto',
                bottom: i >= 2 ? -20 : 'auto',
                left: i % 2 === 0 ? -20 : 'auto',
                right: i % 2 !== 0 ? -20 : 'auto',
                background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)'
              }}
            />
          ))}

          {/* Floating Sparkles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [null, '-=100'],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              className="fixed text-yellow-500 pointer-events-none z-[101] text-xl"
            >
              ✨
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};

function ProfileSelection({ onSelect }: { onSelect: (type: MonsterType) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-black text-gray-800 mb-2">选择你的初始怪兽</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Choose Your Starter Monster</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('daidai')}
          className="bg-gradient-to-br from-sunny-orange to-orange-600 p-8 rounded-[3rem] shadow-2xl shadow-sunny-orange/40 flex flex-col items-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:20px_20px] opacity-20" />
          <span className="text-8xl mb-6 relative z-10">👾</span>
          <h3 className="text-2xl font-black text-white mb-1 relative z-10">呆呆兽</h3>
          <p className="text-white/80 font-bold text-sm relative z-10">潜力无限的基础型怪兽</p>
          <div className="mt-4 flex space-x-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Defense Type</span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

function BossBattle({ onComplete }: { onComplete: () => void }) {
  const [health, setHealth] = useState(100);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  
  const questions = [
    { q: "选出正确的词语：( ) 论", options: ["辨", "辩"], a: "辩", tip: "辩论需要言语，所以是言字旁" },
    { q: "‘不耻下问’的意思是：", options: ["不以向地位比自己低的人请教为耻", "不觉得害羞"], a: "不以向地位比自己低的人请教为耻", tip: "耻：羞耻。下问：向地位比自己低的人请教。" },
    { q: "修改病句：他穿着一件红色的上衣和一顶帽子。", options: ["删掉帽子", "改为：他穿着一件红色的上衣，戴着一顶帽子。"], a: "改为：他穿着一件红色的上衣，戴着一顶帽子。", tip: "动宾搭配不当，“穿”不能搭配“帽子”" }
  ];

  const handleAnswer = (option: string) => {
    if (isAttacking) return;
    
    const isCorrect = option === questions[currentQuestionIndex].a;
    
    if (isCorrect) {
      setIsAttacking(true);
      setFeedback({ type: 'success', text: '知识打击有效！Boss 受到了伤害！' });
      setHealth(h => Math.max(0, h - 35));
      
      setTimeout(() => {
        setFeedback(null);
        setIsAttacking(false);
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else if (health > 35) {
          // 如果题目做完了还没死，循环一下（保险起见）
          setCurrentQuestionIndex(0);
        }
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: `防御失败！${questions[currentQuestionIndex].tip}` });
      setTimeout(() => setFeedback(null), 2000);
    }
  };
  
  useEffect(() => {
    if (health <= 0) {
      setTimeout(onComplete, 1000);
    }
  }, [health, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
      
      {/* Boss Visual */}
      <motion.div 
        animate={isAttacking ? {
          x: [0, -10, 10, -10, 10, 0],
          filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
        } : { y: [0, -20, 0] }}
        transition={isAttacking ? { duration: 0.5 } : { duration: 4, repeat: Infinity }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-purple-600 blur-[80px] opacity-50" />
        <span className="text-9xl relative z-10 filter hue-rotate-180 brightness-50 contrast-150">👻</span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-center mb-4">
          <h2 className="text-purple-400 font-black text-2xl tracking-tighter">知识幻影</h2>
          <p className="text-purple-600 font-bold text-xs uppercase">Knowledge Phantom</p>
        </div>
      </motion.div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* HP Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-purple-400 font-black text-xs uppercase tracking-widest">Boss HP</span>
            <span className="text-purple-400 font-black text-xs">{health}%</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-purple-900 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${health}%` }}
              className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500"
            />
          </div>
        </div>

        {/* Question Area */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="text-purple-300 font-bold text-xs mb-2 uppercase tracking-tighter">Challenge {currentQuestionIndex + 1}</div>
            <h3 className="text-white text-lg font-black mb-6 leading-relaxed">
              {questions[currentQuestionIndex].q}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {questions[currentQuestionIndex].options.map((opt, idx) => (
                <motion.button 
                  key={idx}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(opt)}
                  disabled={isAttacking}
                  className="bg-white/10 border border-white/20 text-white p-4 rounded-2xl font-bold text-left transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">{opt}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback Message */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center font-black p-3 rounded-2xl border-2 ${
                feedback.type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-rose-500/20 border-rose-500 text-rose-400'
              }`}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Combat Effects */}
      <AnimatePresence>
        {isAttacking && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="w-40 h-40 rounded-full bg-yellow-400/40 blur-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [questStage, setQuestStage] = useState<QuestStage>('profile');
  const [monsterType, setMonsterType] = useState<MonsterType>('daidai');
  const [totalExp, setTotalExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [stats, setStats] = useState({ atk: 10, def: 10, per: 10 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [monsterMessage, setMonsterMessage] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [readingMode, setReadingMode] = useState<'reading' | 'discussing' | 'puzzle'>('reading');
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'rules' | 'story'>('rules');

  const [isDataLoaded, setIsDataLoaded] = useState(false); 

  // Ref to hold latest state for auto-saver and unload handler
  const localStateRef = useRef({
    exp: totalExp,
    level: level,
    stats: stats,
    questStage: questStage
  });

  // Keep ref in sync with state
  useEffect(() => {
    localStateRef.current = {
      exp: totalExp,
      level: level,
      stats: stats,
      questStage: questStage
    };
    
    // Also save to localStorage as a robust mobile-first backup
    if (isDataLoaded) {
      localStorage.setItem('monster_profile_backup', JSON.stringify(localStateRef.current));
    }
  }, [totalExp, level, stats, questStage, isDataLoaded]);

  // 获取当前修炼任务
  const getNextTrainingTask = () => {
    switch (questStage) {
      case 'ready':
        return { title: '听写训练', desc: '提升防御力', view: 'foundation' as View };
      case 'foundation_done':
        return { title: '森林阅读', desc: '提升感知力', view: 'mist_forest' as View };
      case 'forest_done':
        return { title: '复仇之战', desc: '消除所有错题', view: 'time_machine' as View };
      case 'time_machine_done':
        // Demo friendly: Show Boss Battle if exp >= 30 (easy to reach)
        return totalExp >= 30 ? { title: 'Boss 战', desc: '知识幻影挑战', view: 'boss_battle' as View } : { title: '积蓄能量', desc: `还需 ${30 - totalExp} EXP 开启挑战`, view: 'foundation' as View };
      default:
        return null;
    }
  };

  const nextTask = getNextTrainingTask();

  // 处理任务完成逻辑 - 原子化操作
  const completeTask = async (type: 'foundation' | 'forest' | 'time_machine' | 'boss') => {
    // 1. 计算所有新状态 (Compute Next State)
    let nextStage: QuestStage = questStage;
    let nextStats = { ...stats };
    let nextExp = totalExp;
    let nextLevel = level;
    let nextMonsterType = monsterType;

    switch (type) {
      case 'foundation':
        nextStats.def += 5;
        nextStage = 'foundation_done';
        break;
      case 'forest':
        nextStats.per += 5;
        nextStage = 'forest_done';
        break;
      case 'time_machine':
        nextStage = 'time_machine_done';
        break;
      case 'boss':
        nextStage = 'evolved';
        nextMonsterType = 'lingguang';
        nextLevel += 1;
        break;
    }

    console.log(`[Task Complete] ${type} -> ${nextStage}`);
    console.log('[Task Complete] New State:', { nextExp, nextLevel, nextStats, nextStage });

    // 2. 立即更新本地 UI (Optimistic UI Update)
    setStats(nextStats);
    setQuestStage(nextStage);
    if (type === 'boss') {
      setMonsterType(nextMonsterType);
      setLevel(nextLevel);
    }

    // 立即更新 ref 确保后续保存使用最新值
    localStateRef.current = {
      exp: nextExp,
      level: nextLevel,
      stats: nextStats,
      questStage: nextStage
    };
    
    // 立即同步到 localStorage，防止手机端刷新丢失
    localStorage.setItem('monster_profile_backup', JSON.stringify(localStateRef.current));

    // 3. 立即发送同步请求 (Immediate Sync)
    // 不依赖 useEffect 的副作用，直接发送计算好的最新状态
    try {
      const payload = {
        exp: Math.max(0, Math.floor(nextExp)),
        level: Math.max(1, Math.floor(nextLevel)),
        atk: Math.max(0, Math.floor(nextStats.atk)),
        def_val: Math.max(0, Math.floor(nextStats.def)),
        per: Math.max(0, Math.floor(nextStats.per)),
        quest_stage: nextStage
      };
      
      console.log('[Task Complete] Syncing payload:', payload);
      await api.syncProfile(payload);
      console.log('[Task Complete] Sync success');
    } catch (error) {
      console.error('[Task Complete] Sync failed:', error);
      // Optional: Revert UI if sync fails (omitted for simplicity in this demo)
    }
  };

  // 计算是否触发“黄金共振”
  const isResonanceActive = (() => {
    const vals = [stats.atk, stats.def, stats.per];
    const avg = vals.reduce((a, b) => a + b, 0) / 3;
    if (avg === 0) return false;
    return vals.every(v => Math.abs(v - avg) / avg < 0.2);
  })();

  // Enable offline sync
  useOfflineSync();

  const handleNavigate = (view: View, label: string) => {
    setCurrentView(view);
  };

  const handleProfileSelect = (type: MonsterType) => {
    setMonsterType(type);
    setQuestStage('ready');
  };

  // 初始化加载数据
  useEffect(() => {
    const fetchStats = async () => {
      console.log(`[Init] Fetching stats. Hostname: ${window.location.hostname}, API Base: ${api.BASE_URL}`);
      let serverData: any = null;
      let localBackup: any = null;

      // 1. Try to get local backup first (fast)
      try {
        const saved = localStorage.getItem('monster_profile_backup');
        if (saved) {
          localBackup = JSON.parse(saved);
          console.log('Local backup found:', localBackup);
        }
      } catch (e) {
        console.error('Failed to parse local backup:', e);
      }

      // 2. Fetch from server
      try {
        serverData = await api.getProfile('current-user');
        console.log('Server data received:', serverData);
      } catch (error) {
        console.error('Failed to fetch stats from server:', error);
      }

      // 3. Decision Logic: Server vs Local
      // If server failed, use local. If server is old, use local.
      let finalData = serverData;
      
      if (!serverData && localBackup) {
        console.log('Server unreachable, using local backup');
        finalData = localBackup;
      } else if (serverData && localBackup) {
        // Basic heuristic: if local has more exp or higher level, it might be unsynced data
        const isLocalNewer = (localBackup.level > serverData.level) || 
                             (localBackup.level === serverData.level && localBackup.exp > serverData.exp) ||
                             (localBackup.questStage !== serverData.quest_stage && serverData.quest_stage === 'profile'); // If server is at profile but local has progress
        
        if (isLocalNewer) {
          console.warn('Local backup appears newer than server data. Recovering...');
          finalData = localBackup;
          // Trigger a sync to server since we know local is better
          setTimeout(() => saveProfile(), 2000); 
        }
      }

      if (finalData) {
        setTotalExp(finalData.exp || 0);
        setLevel(finalData.level || 1);
        setStats({ 
          atk: finalData.atk || (finalData.stats ? finalData.stats.atk : 10), 
          def: finalData.def_val || (finalData.stats ? finalData.stats.def : 10), 
          per: finalData.per || (finalData.stats ? finalData.stats.per : 10) 
        });
        const stage = finalData.quest_stage || finalData.questStage;
        if (stage) {
          setQuestStage(stage as QuestStage);
        }
        setIsDataLoaded(true);
      }
      
      setIsInitialLoad(false);
    };
    fetchStats();
  }, []);

  // 状态同步到后端 (Auto-sync removed, replaced with manual sync logic)
  /* 
  useEffect(() => {
    // ... removed ...
  }, [totalExp, level, stats, questStage, isInitialLoad, isDataLoaded]);
  */

  const saveProfile = async (isUnloading = false) => {
    if (!isDataLoaded) return;
    
    try {
        const state = localStateRef.current;
        const payload = {
          exp: Math.max(0, Math.floor(state.exp || 0)),
          level: Math.max(1, Math.floor(state.level || 1)),
          atk: Math.max(0, Math.floor(state.stats.atk || 10)),
          def_val: Math.max(0, Math.floor(state.stats.def || 10)),
          per: Math.max(0, Math.floor(state.stats.per || 10)),
          quest_stage: state.questStage
        };
        
        const url = `${api.BASE_URL}/v1/user/stats`;
        console.log(`[${isUnloading ? 'Unload' : 'Auto'} Sync] Sending to ${url}, payload:`, payload);
        
        if (isUnloading) {
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            const success = navigator.sendBeacon(url, blob);
            console.log('[Unload Sync] Beacon success:', success);
          } else {
            // Fallback for older browsers
            fetch(url, { 
              method: 'POST', 
              body: JSON.stringify(payload), 
              headers: { 'Content-Type': 'application/json' },
              keepalive: true 
            }).catch(e => console.error('Unload fetch failed:', e));
          }
        } else {
          await api.syncProfile(payload);
          console.log('[Auto Sync] Success');
        }
    } catch (error) {
        console.error('Failed to sync stats:', error);
    }
  };

  // Periodic dirty check or auto-save
  useEffect(() => {
    if (isInitialLoad || !isDataLoaded) return;
    
    const timer = setInterval(() => {
        saveProfile();
    }, 30000); // Auto-save every 30s

    // Mobile-friendly: save on visibility change (app backgrounded/closed)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[Mobile] Visibility hidden, saving profile...');
        saveProfile(true);
      }
    };

    // Traditional unload handler
    const handleUnload = () => {
      saveProfile(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isInitialLoad, isDataLoaded]);

  // 升级逻辑
  useEffect(() => {
    const newLevel = Math.floor(totalExp / 100) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  }, [totalExp]);

  const handleDictationComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setStats(prev => ({ ...prev, def: prev.def + Math.floor(finalExp / 10) }));
    api.logLearning({
      student_id: 'default_user',
      kp_code: '基础词汇',
      is_correct: true,
      exp_gained: finalExp
    }).catch(console.error);
    
    if (questStage === 'ready') {
      console.log('Dictation complete, advancing stage...');
      completeTask('foundation');
    } else {
      console.log('Dictation complete, but stage is not ready:', questStage);
    }
    setCurrentView('home');
  };

  const handleReadingComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setStats(prev => ({ ...prev, per: prev.per + Math.floor(finalExp / 10) }));
    api.logLearning({
      student_id: 'default_user',
      kp_code: '阅读理解',
      is_correct: true,
      exp_gained: finalExp
    }).catch(console.error);
    
    if (questStage === 'foundation_done') {
      console.log('Reading complete, advancing stage...');
      completeTask('forest');
    }
    setCurrentView('home');
  };

  const handleCrushComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    api.logLearning({
      student_id: 'default_user',
      kp_code: '错题消杀',
      is_correct: true,
      exp_gained: finalExp
    }).catch(console.error);
    
    if (questStage === 'forest_done') {
      console.log('Crush complete, advancing stage...');
      completeTask('time_machine');
    }
    setCurrentView('home');
  };

  const handleWritingComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setStats(prev => ({ ...prev, atk: prev.atk + Math.floor(finalExp / 10) }));
    api.logLearning({
      student_id: 'default_user',
      kp_code: '写作训练',
      is_correct: true,
      exp_gained: finalExp
    }).catch(console.error);
    setCurrentView('home');
  };

  const handleSurgeryComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setCurrentView('home');
  };

  const handleTypoComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setCurrentView('home');
  };

  const handleMatchingComplete = (gainedExp: number) => {
    const finalExp = isResonanceActive ? Math.floor(gainedExp * 1.2) : gainedExp;
    setTotalExp(prev => prev + finalExp);
    setCurrentView('home');
  };

  const handleMonsterClick = () => {
    // PRD 8.0: Simulate clicking Little Dragon to trigger random emotions
    const messages = [
      '嗷呜！我们要去哪里冒险？',
      '我的能量条好像快满了！',
      '听说迷雾森林里有宝藏...',
      '昨天的错题你都学会了吗？',
      '快带我去英雄名人堂看看！',
      '今天也要元气满满哦！',
      '感受到我体内的洪荒之力了吗？'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    setMonsterMessage(randomMessage);
    
    // 3秒后自动关闭气泡
    setTimeout(() => {
      setMonsterMessage(null);
    }, 3000);
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-sunny-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sunny-orange font-black animate-pulse text-lg">怪兽逆袭中...</p>
          <button 
            onClick={() => setIsInitialLoad(false)}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold"
          >
            跳过加载 (调试)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-4 flex flex-col items-center max-w-lg mx-auto overflow-x-hidden relative">
      <ResonanceVisuals active={isResonanceActive} />
      
      {questStage === 'profile' && (
        <ProfileSelection onSelect={handleProfileSelect} />
      )}

      {currentView === 'boss_battle' && (
        <BossBattle onComplete={() => {
          completeTask('boss');
          setCurrentView('home');
          setShowSummary(true);
        }} />
      )}

      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-sunny-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-sunny-orange w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">今日成长小结</h2>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                  <span className="text-gray-500 font-bold">获得 EXP</span>
                  <span className="text-sunny-orange font-black">+25</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                  <span className="text-gray-500 font-bold">防御力提升</span>
                  <span className="text-blue-500 font-black">+5</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                  <span className="text-gray-500 font-bold">感知力提升</span>
                  <span className="text-emerald-500 font-black">+5</span>
                </div>
                <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center space-x-2 animate-pulse">
                  <Sword className="text-red-500 w-4 h-4" />
                  <span className="text-red-600 font-black text-sm">竞技场已解锁！快去挑战吧</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSummary(false)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all"
              >
                收下奖励
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-sunny-orange opacity-[0.08] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-sunny-orange-300 opacity-[0.08] blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'home' ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center z-10"
          >
            {/* Header */}
            <header className="w-full flex justify-between items-center mb-6 md:mb-8 pt-2 md:pt-4 px-1 md:px-2">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-sunny-orange/10 border border-sunny-orange-50">
                  <Sparkles className="text-sunny-orange w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-none mb-0.5 md:mb-1">
                    {monsterType === 'daidai' ? '呆呆兽' : '灵光兽'} · {level}级
                  </h1>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">怪兽逆袭之路</p>
                    {isResonanceActive && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[7px] md:text-[8px] font-black bg-yellow-400 text-yellow-900 px-1 md:px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap"
                      >
                        黄金共振 ✨
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-sunny-orange text-white rounded-lg md:rounded-xl shadow-lg shadow-sunny-orange-100 text-xs md:text-sm font-black backdrop-blur-sm">
                  LV.{level}
                </div>
              </div>
            </header>

            {/* Monster Area (Stats integrated) */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleMonsterClick}
              className="relative w-full aspect-square flex flex-col items-center justify-center mb-4 overflow-visible cursor-pointer group"
            >
              {/* Animated Rings - Larger and subtle */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-full h-full border-[1px] border-dashed border-sunny-orange-100/20 rounded-full"
              />
              
              <div className="relative group z-10">
                <AnimatePresence>
                  {monsterMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.8 }}
                      className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl border border-sunny-orange/10 z-30 min-w-[160px] text-center"
                    >
                      <div className="text-sm font-bold text-gray-700 leading-snug">
                        {monsterMessage}
                      </div>
                      {/* Triangle pointer */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-sunny-orange/10 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  animate={isResonanceActive ? {
                    boxShadow: [
                      "0 0 20px rgba(255,215,0,0.4)",
                      "0 0 40px rgba(255,215,0,0.8)",
                      "0 0 20px rgba(255,215,0,0.4)"
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-40 h-40 bg-gradient-to-br from-sunny-orange to-orange-600 rounded-[3rem] flex items-center justify-center text-7xl shadow-2xl shadow-sunny-orange-200/50 relative overflow-hidden"
                >
                  {isResonanceActive && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:10px_10px]"
                    />
                  )}
                  {monsterType === 'lingguang' ? '🦄' : '👾'}
                </motion.div>
                
                {/* Evolution Badge */}
                {questStage === 'evolved' && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-4 -left-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border-2 border-white z-20"
                  >
                    已进化：灵光兽
                  </motion.div>
                )}

                {/* Resonance Badge */}
                {isResonanceActive && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center space-x-1 z-20"
                  >
                    <Zap size={10} fill="currentColor" />
                    <span>黄金共振</span>
                  </motion.div>
                )}
              </div>

              {/* Stats Floating around the monster */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { icon: <Sword className="w-4 h-4 md:w-[16px] md:h-[16px]" />, label: 'ATK', value: stats.atk, pos: 'top-10 left-2 md:left-4', color: 'text-rose-500', bg: 'bg-rose-50' },
              { icon: <Shield className="w-4 h-4 md:w-[16px] md:h-[16px]" />, label: 'DEF', value: stats.def, pos: 'top-10 right-2 md:right-4', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: <Eye className="w-4 h-4 md:w-[16px] md:h-[16px]" />, label: 'PER', value: stats.per, pos: 'bottom-20 left-2 md:left-4', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`absolute ${stat.pos} p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-white/50 flex flex-col items-center min-w-[50px] md:min-w-[60px]`}
              >
                <div className={`${stat.bg} ${stat.color} p-1 md:p-1.5 rounded-lg mb-1`}>
                  {stat.icon}
                </div>
                <span className="text-xs md:text-[14px] font-black text-gray-700">{stat.value}</span>
              </motion.div>
            ))}
          </div>
              
              {/* EXP Bar integrated at the bottom of monster area */}
          <div className="absolute bottom-4 w-full px-8 flex flex-col items-center">
            <div className="w-full h-3 bg-gray-100/30 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-sunny-orange via-yellow-400 to-sunny-orange bg-[length:200%_100%]"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${totalExp % 100}%`,
                  backgroundPosition: ['0% 0%', '200% 0%']
                }}
                transition={{
                  width: { duration: 1, ease: "easeOut" },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
              </motion.div>
            </div>
            <div className="mt-2 flex justify-between w-full px-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">能量核心 (EXP)</span>
              <motion.span 
                key={totalExp}
                initial={{ scale: 1.2, color: '#FF8C42' }}
                animate={{ scale: 1, color: '#FF8C42' }}
                className="text-[9px] font-black"
              >
                {totalExp % 100} / 100
              </motion.span>
            </div>
          </div>

              <motion.div 
                animate={{ y: [0, -10, 0], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-10 text-sunny-orange/30"
              >
                <Sparkles size={32} />
              </motion.div>
            </motion.div>

            {/* Today's Training - Quest Guide */}
            {nextTask && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-6 px-1 md:px-0 relative"
              >
                <button 
                  onClick={() => handleNavigate(nextTask.view, nextTask.title)}
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-3xl shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-sunny-orange rounded-2xl flex items-center justify-center shadow-lg shadow-sunny-orange/20 group-hover:rotate-6 transition-transform">
                      <Sword className="text-white w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-black text-lg leading-tight">今日修炼</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{nextTask.title} · {nextTask.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGuide(!showGuide);
                      }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-help"
                    >
                      <MessageCircle size={16} className="text-sunny-orange" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="text-white" />
                    </div>
                  </div>
                </button>

                {/* Gameplay Guide Tooltip */}
                <AnimatePresence>
                  {showGuide && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-4 z-50 bg-white rounded-[2rem] p-6 shadow-2xl border border-sunny-orange/10"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-gray-800 flex items-center">
                          <span className="w-8 h-8 bg-sunny-orange/10 rounded-lg flex items-center justify-center mr-2 text-sunny-orange text-lg">🎮</span>
                          玩法攻略
                        </h4>
                        <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600 p-2">
                          <XCircle size={24} />
                        </button>
                      </div>

                      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                        <button 
                          onClick={() => setGuideTab('rules')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${guideTab === 'rules' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
                        >
                          核心规则
                        </button>
                        <button 
                          onClick={() => setGuideTab('story')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${guideTab === 'story' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
                        >
                          进化之路
                        </button>
                      </div>

                      {guideTab === 'rules' ? (
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black shrink-0">1</div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 mb-0.5">基础修炼</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                通过“今日修炼”完成听写和阅读，精准提升怪兽的<span className="text-blue-500 font-bold">防御(DEF)</span>与<span className="text-emerald-500 font-bold">感知(PER)</span>。
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-black shrink-0">2</div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 mb-0.5">能量积累</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                每次修炼获得 <span className="text-sunny-orange font-bold">EXP</span>。当 EXP 积累满 30 点且完成前置任务，即可开启 Boss 战传送门。
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 bg-red-50/50 p-3 rounded-2xl border border-red-100/50">
                            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-sm font-black shrink-0">3</div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 mb-0.5">终极进化</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                在 Boss 战中通过语文终极挑战，击败“知识幻影”，你的怪兽将完成从幼体到<span className="text-indigo-600 font-bold">灵光兽</span>的华丽进化！
                              </p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-sunny-orange to-orange-500 p-4 rounded-2xl shadow-lg shadow-sunny-orange/20">
                            <p className="text-[11px] text-white font-bold flex items-center">
                              <Sparkles size={14} className="mr-1.5" />
                              进阶秘籍：保持各项属性均衡（差值 &lt; 20%）可触发“黄金共振”，获得 1.2 倍 EXP 额外加成！
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative pb-4 before:absolute before:left-[15px] before:top-8 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-sunny-orange before:to-emerald-500">
                            <div className="relative pl-10">
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-sunny-orange border-4 border-white shadow-md z-10 flex items-center justify-center text-white text-[10px] font-black">ST1</div>
                              <h5 className="text-sm font-black text-gray-800 mb-1">铸造坚盾：听写特训</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                开启“今日修炼”，首先进入听写站。每掌握一个生字词，都在为怪兽层层叠甲。这能大幅提升 <span className="text-blue-500 font-bold">防御力 (DEF)</span>，是抵御 Boss 猛烈攻击的唯一手段！
                              </p>
                            </div>
                          </div>
                          
                          <div className="relative pb-4 before:absolute before:left-[15px] before:top-8 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500 before:to-rose-500">
                            <div className="relative pl-10">
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-white shadow-md z-10 flex items-center justify-center text-white text-[10px] font-black">ST2</div>
                              <h5 className="text-sm font-black text-gray-800 mb-1">觉醒之眼：迷雾阅读</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                听写完成后，任务自动流向迷雾森林。通过阶梯式拆解看透文章背后的逻辑，这将觉醒怪兽的 <span className="text-emerald-500 font-bold">感知力 (PER)</span>，识破 Boss 设下的所有文字陷阱。
                              </p>
                            </div>
                          </div>

                          <div className="relative pb-4 before:absolute before:left-[15px] before:top-8 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-rose-500 before:to-indigo-600">
                            <div className="relative pl-10">
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-rose-500 border-4 border-white shadow-md z-10 flex items-center justify-center text-white text-[10px] font-black">ST3</div>
                              <h5 className="text-sm font-black text-gray-800 mb-1">斩断过去：时光复仇</h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                最后，卡片将引导你进入时光回溯。精准消灭曾经的错题，清空所有“昨日之敌”。只有斩断过去的弱点，通往终极 Boss 战的传送门才会真正开启。
                              </p>
                            </div>
                          </div>

                          <div className="relative pl-10">
                            <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 border-4 border-white shadow-lg z-10 flex items-center justify-center text-white text-xs">⚔️</div>
                            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                              <h5 className="text-sm font-black text-indigo-900 mb-1">终极挑战：挑战 BOSS</h5>
                              <p className="text-[11px] text-indigo-700/80 leading-relaxed font-medium">
                                当你叠满护甲、觉醒感知、斩断弱点后，点击“挑战 Boss”！在限时激战中击败知识幻影，见证怪兽的<span className="font-black">终极进化</span>！
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Modules Grid */}
            <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3 w-full mb-4 px-1 md:px-0">
              <ModuleCard 
                onClick={() => handleNavigate('foundation', '能量收集站')}
                icon={<Zap />}
                title="能量收集站"
                sub="THE FOUNDATION"
                description="积累基础能量，打好扎实基础"
                variant="foundation"
                delay={0.1}
              />
              <ModuleCard 
                onClick={() => handleNavigate('mist_forest', '迷雾森林')}
                icon={<Map />}
                title="迷雾森林"
                sub="THE READER"
                description="探索文字迷宫，提升阅读能力"
                variant="forest"
                delay={0.2}
              />
              <ModuleCard 
                onClick={() => handleNavigate('magic_workshop', '魔法工坊')}
                icon={<PenTool />}
                title="魔法工坊"
                sub="THE WRITER"
                description="挥洒创意笔墨，铸就文学之美"
                variant="magic"
                delay={0.3}
              />
              <ModuleCard 
                onClick={() => handleNavigate('time_machine', '时光回溯机')}
                icon={<Clock />}
                title="时光回溯机"
                sub="THE ERROR BANK"
                description="温故而知新，攻克薄弱环节"
                variant="time"
                delay={0.4}
              />
              <ModuleCard 
                onClick={() => handleNavigate('hero_hall', '英雄名人堂')}
                icon={<Trophy />}
                title="英雄名人堂"
                sub="HALL OF FAME"
                description="见证成长足迹，成就非凡英雄"
                variant="hall"
                delay={0.5}
              />
              <ModuleCard 
                onClick={() => handleNavigate('time_portal', '时空传送门')}
                icon={<Users />}
                title="时空传送门"
                sub="ACCOUNT & ID"
                description="穿越时空边界，管理你的身份"
                variant="portal"
                delay={0.6}
              />
            </div>

            <MenuButton 
              onClick={() => handleNavigate('growth', '成长图谱')}
              icon={<Sparkles size={24} />}
              label="成长图谱"
              sub="EVOLUTION DATA"
              theme="dark"
              variant="growth"
            />

            <div className="w-full mt-4">
              <MenuButton 
                onClick={() => handleNavigate('parent', '家长端')}
                icon={<Users size={24} />}
                label="家长端"
                sub="PARENT HUB"
                theme="light"
                variant="parent"
              />
            </div>

            <footer className="mt-8 mb-8 text-center">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] mb-2">Monster Intelligence Training System</p>
              <p className="text-[9px] text-gray-400/60 font-medium">© 2026 怪兽逆袭.</p>
            </footer>
          </motion.div>
        ) : currentView === 'foundation' ? (
          <motion.div key="foundation" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <FoundationTerminal onBack={() => setCurrentView('home')} onNavigate={(f) => setCurrentView(f as View)} />
          </motion.div>
        ) : currentView === 'mist_forest' ? (
          <motion.div key="mist_forest" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <MistForest 
              onBack={() => setCurrentView('home')} 
              onNavigate={(f, mode) => {
                if (mode) setReadingMode(mode as any);
                setCurrentView(f as View);
              }} 
            />
          </motion.div>
        ) : currentView === 'magic_workshop' ? (
          <motion.div key="magic_workshop" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <MagicWorkshop onBack={() => setCurrentView('home')} onNavigate={(f) => setCurrentView(f as View)} />
          </motion.div>
        ) : currentView === 'time_machine' ? (
          <motion.div key="time_machine" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <TimeMachine onBack={() => setCurrentView('home')} onCrushStart={() => setCurrentView('crush')} />
          </motion.div>
        ) : currentView === 'hero_hall' ? (
          <motion.div key="hero_hall" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <HeroHall 
              onBack={() => setCurrentView('home')} 
              onNavigate={(v) => setCurrentView(v as View)}
              stats={stats} 
              totalExp={totalExp} 
            />
          </motion.div>
        ) : currentView === 'growth' ? (
          <motion.div key="growth" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <GrowthAtlas onBack={() => setCurrentView('home')} />
          </motion.div>
        ) : currentView === 'radio' ? (
          <motion.div key="radio" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <RadioStation onBack={() => setCurrentView('foundation')} />
          </motion.div>
        ) : currentView === 'duel' ? (
          <motion.div key="duel" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ShadowDuel onBack={() => setCurrentView('hero_hall')} />
          </motion.div>
        ) : currentView === 'parent' ? (
          <motion.div key="parent" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ParentHub onBack={() => setCurrentView('home')} />
          </motion.div>
        ) : currentView === 'time_portal' ? (
          <motion.div key="time_portal" className="w-full h-full min-h-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <TimePortal onBack={() => setCurrentView('home')} />
          </motion.div>
        ) : currentView === 'dictation' ? (
            <motion.div 
              key="dictation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-[80vh]"
            >
              <DictationBot 
                onBack={() => setCurrentView('foundation')} 
                onComplete={handleDictationComplete} 
              />
            </motion.div>
          ) : currentView === 'matching' ? (
            <motion.div 
              key="matching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-[80vh]"
            >
              <WordMatching 
                onBack={() => setCurrentView('foundation')} 
                onComplete={handleMatchingComplete} 
              />
            </motion.div>
          ) : currentView === 'reading' ? (
          <motion.div 
            key="reading"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full min-h-[80vh]"
          >
            <ReadingCoach 
              initialMode={readingMode}
              onBack={() => setCurrentView('mist_forest')} 
              onComplete={handleReadingComplete} 
            />
          </motion.div>
          ) : currentView === 'writing' ? (
            <motion.div 
              key="writing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-[80vh]"
            >
              <WritingPilot 
                onBack={() => setCurrentView('magic_workshop')} 
                onComplete={handleWritingComplete} 
              />
            </motion.div>
          ) : currentView === 'typo' ? (
            <motion.div 
              key="typo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-[80vh]"
            >
              <TypoClinic 
                onBack={() => setCurrentView('foundation')} 
                onComplete={handleTypoComplete} 
              />
            </motion.div>
          ) : currentView === 'surgery' ? (
            <motion.div 
              key="surgery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full min-h-[80vh]"
            >
              <SentenceSurgery 
                onBack={() => setCurrentView('foundation')} 
                onComplete={handleSurgeryComplete} 
              />
            </motion.div>
          ) : currentView === 'crush' ? (
            <motion.div 
              key="crush"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full h-full min-h-[80vh]"
            >
              <ErrorCrush 
                onBack={() => setCurrentView('time_machine')} 
                onComplete={handleCrushComplete} 
              />
            </motion.div>
          ) : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
