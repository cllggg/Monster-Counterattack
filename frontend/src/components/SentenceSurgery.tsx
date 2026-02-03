import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Scissors, Trash2, Plus, Move, RotateCcw, AlertTriangle, Wand2 } from 'lucide-react';
import { api } from '../services/api';

interface SentenceSurgeryProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

interface SentenceQuestion {
  original: string;
  type: 'redundant' | 'missing' | 'order';
  correct: string;
  explanation: string;
}

interface RhetoricQuestion {
  original: string;
  type: 'metaphor' | 'personification' | 'hyperbole'; // 比喻, 拟人, 夸张
  target: string;
  hint: string;
}

const MOCK_SENTENCES: SentenceQuestion[] = [
  { 
    original: "我们必须一定要努力学习。", 
    type: 'redundant', 
    correct: "我们必须努力学习。 / 我们一定要努力学习。", 
    explanation: "“必须”和“一定要”意思重复，保留一个即可。" 
  },
  { 
    original: "由于他勤奋学习，得到了好成绩。", 
    type: 'missing', 
    correct: "由于他勤奋学习，他得到了好成绩。", 
    explanation: "缺少主语，在“得到了”前面加上“他”。" 
  },
  { 
    original: "我们要采取各种办法培养和提高教学质量。", 
    type: 'order', 
    correct: "我们要采取各种办法提高教学质量。", 
    explanation: "“培养”与“质量”搭配不当，应删掉“培养和”。" 
  },
  { 
    original: "他的家乡是广东省广州市人。", 
    type: 'redundant', 
    correct: "他的家乡是广东省广州市。 / 他是广东省广州市人。", 
    explanation: "主语“家乡”与宾语“人”搭配不当，或是意思重复。" 
  },
  { 
    original: "在老师的帮助下，使我取得了很大的进步。", 
    type: 'missing', 
    correct: "老师的帮助，使我取得了很大的进步。 / 在老师的帮助下，我取得了很大的进步。", 
    explanation: "滥用介词导致缺少主语，应去掉“在”和“下”，或者去掉“使”。" 
  }
];

const MOCK_RHETORIC: RhetoricQuestion[] = [
  {
    original: "太阳很红，很亮。",
    type: 'metaphor',
    target: "太阳像个大火球，挂在天上。",
    hint: "试着把太阳比作一种圆圆的、发光发热的东西。"
  },
  {
    original: "小鸟在树上叫。",
    type: 'personification',
    target: "小鸟在树上唱歌。",
    hint: "把小鸟当成人来写，它在做什么快乐的事情？"
  },
  {
    original: "教室里非常安静。",
    type: 'hyperbole',
    target: "教室里安静得连一根针掉在地上的声音都能听见。",
    hint: "用夸张的手法形容安静的程度。"
  }
];

const SentenceSurgery: React.FC<SentenceSurgeryProps> = ({ onBack, onComplete }) => {
  const [mode, setMode] = useState<'clinic' | 'rhetoric'>('clinic');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rhetoricIndex, setRhetoricIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const MonsterReaction = ({ status }: { status: string }) => {
    return (
      <motion.div 
        animate={status === 'correct' ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : 
                 status === 'wrong' ? { y: [0, 5, -5, 5, 0], opacity: [1, 0.7, 1] } : {}}
        className="text-4xl"
      >
        {status === 'correct' ? (mode === 'clinic' ? '🏥' : '✨') : status === 'wrong' ? (mode === 'clinic' ? '🚑' : '💨') : (mode === 'clinic' ? '✂️' : '🪄')}
      </motion.div>
    );
  };

  const currentQuestion = MOCK_SENTENCES[currentIndex];
  const currentRhetoric = MOCK_RHETORIC[rhetoricIndex];

  const handleSubmit = async () => {
    try {
      // Use AI Diagnosis via API
      const res = await api.diagnoseSentence(
        'default_user',
        mode === 'clinic' ? currentQuestion.original : currentRhetoric.original,
        userInput,
        mode === 'clinic' ? currentQuestion.type : currentRhetoric.type
      );
      
      if (res.is_correct) {
        setStatus('correct');
        setScore(prev => prev + res.exp_reward);
      } else {
        setStatus('wrong');
        // Ideally we would show res.feedback_text too
      }
      setShowExplanation(true);
    } catch (error) {
      console.error('Diagnosis failed, falling back to local check:', error);
      
      // Fallback: Local Logic
      const cleanInput = userInput.replace(/\s+/g, '').replace(/[，。！？]/g, '');
      if (mode === 'clinic') {
        const cleanCorrect = currentQuestion.correct.split(' / ').map(c => c.replace(/\s+/g, '').replace(/[，。！？]/g, ''));
        if (cleanCorrect.includes(cleanInput)) {
          setStatus('correct');
          setScore(prev => prev + 25);
        } else {
          setStatus('wrong');
        }
      } else {
        const cleanTarget = currentRhetoric.target.replace(/\s+/g, '').replace(/[，。！？]/g, '');
        if (cleanInput === cleanTarget || cleanInput.length > currentRhetoric.original.length + 2) { 
          setStatus('correct');
          setScore(prev => prev + 30);
        } else {
          setStatus('wrong');
        }
      }
      setShowExplanation(true);
    }
  };

  const nextQuestion = () => {
    if (mode === 'clinic') {
      if (currentIndex < MOCK_SENTENCES.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
        setStatus('idle');
        setShowExplanation(false);
      } else {
        setShowResult(true);
      }
    } else {
      if (rhetoricIndex < MOCK_RHETORIC.length - 1) {
        setRhetoricIndex(prev => prev + 1);
        setUserInput('');
        setStatus('idle');
        setShowExplanation(false);
      } else {
        setShowResult(true);
      }
    }
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center"
      >
        <div className="w-24 h-24 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6">
          <Scissors size={48} className="text-sunny-orange" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">手术大成功！</h2>
        <p className="text-gray-400 font-medium mb-8">怪兽的语言逻辑得到了修复</p>
        
        <div className="bg-sunny-orange-50/50 backdrop-blur-sm rounded-3xl p-6 w-full mb-8 border border-sunny-orange-100/50">
          <div className="text-sm text-sunny-orange-600 font-bold uppercase tracking-widest mb-1">获得能量</div>
          <div className="text-5xl font-black text-sunny-orange">+{score}</div>
        </div>

        <button 
          onClick={() => onComplete(score)}
          className="w-full py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95"
        >
          注入能量核心
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-sunny-orange-50 relative overflow-hidden max-h-[90vh]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Scissors size={200} className="text-sunny-orange" />
      </div>

      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-sunny-orange-50 rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex flex-col items-center">
          <MonsterReaction status={status} />
          <span className="text-[10px] font-black text-sunny-orange-300 uppercase tracking-[0.2em] mt-2">
            {mode === 'clinic' ? '病句手术台' : '修辞魔法屋'}
          </span>
        </div>
        <button 
          onClick={() => {
            setMode(mode === 'clinic' ? 'rhetoric' : 'clinic');
            setStatus('idle');
            setShowExplanation(false);
            setUserInput('');
          }}
          className={`p-3 rounded-2xl transition-colors ${mode === 'rhetoric' ? 'bg-purple-100 text-purple-500' : 'hover:bg-sunny-orange-50 text-gray-400'}`}
        >
          {mode === 'clinic' ? <Wand2 size={24} /> : <Scissors size={24} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 z-10 space-y-6">
        <div className="bg-sunny-orange-50/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-sunny-orange-100 shadow-sm relative mt-4 group">
          <div className={`absolute -top-3 left-8 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg ${mode === 'clinic' ? 'bg-sunny-orange shadow-sunny-orange-100' : 'bg-purple-500 shadow-purple-200'}`}>
            {mode === 'clinic' ? '待诊病例' : '原句'}
          </div>
          <p className="text-xl font-bold text-gray-800 leading-relaxed italic text-center">
            “{mode === 'clinic' ? currentQuestion.original : currentRhetoric.original}”
          </p>
          {mode === 'rhetoric' && (
            <p className="text-center text-xs text-purple-400 font-bold mt-2">
              目标：{currentRhetoric.type === 'metaphor' ? '改为比喻句' : currentRhetoric.type === 'personification' ? '改为拟人句' : '改为夸张句'}
            </p>
          )}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute bottom-4 right-8"
          >
            {mode === 'clinic' ? <AlertTriangle size={24} className="text-sunny-orange-200" /> : <Sparkles size={24} className="text-purple-200" />}
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              {mode === 'clinic' ? '制定手术方案' : '施展修辞魔法'}
            </span>
            {mode === 'clinic' && (
              <div className="flex space-x-3">
                {[
                  { icon: <Plus size={12} />, label: '增', color: 'text-sunny-orange-700', bg: 'bg-sunny-orange-50' },
                  { icon: <Trash2 size={12} />, label: '删', color: 'text-sunny-orange', bg: 'bg-sunny-orange-50' },
                  { icon: <Move size={12} />, label: '调', color: 'text-sunny-orange-600', bg: 'bg-sunny-orange-50' }
                ].map((tool, i) => (
                  <div key={i} className={`flex items-center space-x-1 ${tool.bg} ${tool.color} px-2 py-1 rounded-lg text-[10px] font-black`}>
                    {tool.icon}
                    <span>{tool.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showExplanation}
              placeholder={mode === 'clinic' ? "请在此输入修复后的正确句子..." : "请在此输入改写后的句子..."}
              className={`w-full h-36 p-6 bg-white/70 backdrop-blur-md rounded-[2.5rem] border-2 transition-all outline-none font-bold text-gray-700 resize-none shadow-xl shadow-gray-100/50 ${
                status === 'correct' ? 'border-sunny-orange' : 
                status === 'wrong' ? 'border-sunny-orange-200' : 
                'border-gray-50 focus:border-sunny-orange-200'
              }`}
            />
            {!showExplanation && userInput.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setUserInput(mode === 'clinic' ? currentQuestion.original : currentRhetoric.original)}
                className="absolute bottom-4 right-4 p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-all"
              >
                <RotateCcw size={16} />
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[2rem] border backdrop-blur-md ${
                status === 'correct' ? 'bg-sunny-orange-50/80 border-sunny-orange-100' : 'bg-white/80 border-gray-100'
              }`}
            >
              <div className="flex items-start space-x-3">
                {status === 'correct' ? <CheckCircle2 className="text-sunny-orange shrink-0" size={20} /> : <XCircle className="text-gray-400 shrink-0" size={20} />}
                <div className="flex-1">
                  <div className={`text-xs font-black mb-1.5 ${status === 'correct' ? 'text-sunny-orange-700' : 'text-gray-700'}`}>
                    {status === 'correct' ? (mode === 'clinic' ? '手术成功！逻辑通顺' : '魔法生效！生动形象') : (mode === 'clinic' ? '手术失败，请查看诊断报告' : '魔法失效，请查看咒语提示')}
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-600 leading-relaxed bg-white/40 p-2 rounded-xl border border-white/60">
                      <span className="font-bold text-gray-800">参考方案：</span><br/>
                      {mode === 'clinic' ? currentQuestion.correct : currentRhetoric.target}
                    </div>
                    <div className="text-[11px] text-gray-500 italic bg-white/40 p-2 rounded-xl border border-dashed border-gray-200">
                      <span className="font-bold text-gray-700">{mode === 'clinic' ? '诊断报告：' : '咒语提示：'}</span><br/>
                      {mode === 'clinic' ? currentQuestion.explanation : currentRhetoric.hint}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sticky Area */}
      <div className="shrink-0 pt-4 z-10 space-y-4">
        {showExplanation ? (
          <button
            onClick={nextQuestion}
            className="w-full py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95"
          >
            {currentIndex < MOCK_SENTENCES.length - 1 ? '下一位患者' : '查看报告'}
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => setUserInput(currentQuestion.original)}
              className="p-5 bg-gray-100 text-gray-500 rounded-[2rem] hover:bg-gray-200 transition-all shadow-sm"
              title="重置句子"
            >
              <RotateCcw size={24} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="flex-1 py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              执行手术
            </button>
          </div>
        )}

        <div className="p-4 bg-white/50 backdrop-blur-md rounded-3xl border border-white/50">
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>手术进度</span>
            <span>{currentIndex + 1} / {MOCK_SENTENCES.length}</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-sunny-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / MOCK_SENTENCES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceSurgery;