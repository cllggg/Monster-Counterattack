import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Search, Timer, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface TypoClinicProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

interface Question {
  text: string;
  wrongChar: string;
  correctChar: string;
  explanation: string;
}

const MOCK_QUESTIONS: Question[] = [
  { text: "他总是分不清楚“辩”和“辨”，经常把辩论写成辨论。", wrongChar: "辨论", correctChar: "辩论", explanation: "“辩”与言语有关（中间是言），所以“辩论”用“辩”；“辨”与区别有关（中间是点撇），如“辨别”。" },
  { text: "这件衣服的颜色非常漂酿，我很喜欢。", wrongChar: "漂酿", correctChar: "漂亮", explanation: "“漂亮”的“亮”是轻声，不是“酿”。" },
  { text: "我们要养成勤检节约的好习惯。", wrongChar: "勤检", correctChar: "勤俭", explanation: "“俭”指节省，如“勤俭”；“检”指查验，如“检查”。" },
  { text: "他是一个非常有耐心的按排者。", wrongChar: "按排", correctChar: "安排", explanation: "“安排”的“安”是安定的意思，不是“按”。" },
  { text: "老师经常教导我们要克苦钻研。", wrongChar: "克苦", correctChar: "刻苦", explanation: "“刻苦”指像雕刻一样用力，形容极度勤奋。" }
];

const TypoClinic: React.FC<TypoClinicProps> = ({ onBack, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const MonsterReaction = ({ status }: { status: string }) => {
    return (
      <motion.div 
        animate={status === 'correct' ? { scale: [1, 1.2, 1], y: [0, -10, 0] } : 
                 status === 'wrong' ? { rotate: [0, 10, -10, 10, 0], filter: ['grayscale(0)', 'grayscale(1)', 'grayscale(0)'] } : {}}
        className="text-4xl"
      >
        {status === 'correct' ? '💉' : status === 'wrong' ? '🤒' : '🔍'}
      </motion.div>
    );
  };

  const currentQuestion = MOCK_QUESTIONS[currentIndex];

  useEffect(() => {
    if (showResult || showExplanation) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleWrong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, showResult, showExplanation]);

  const handleCorrect = () => {
    setStatus('correct');
    setScore(prev => prev + 20);
    setShowExplanation(true);
  };

  const handleWrong = () => {
    setStatus('wrong');
    setShowExplanation(true);
    
    // 记录错题
    const recordMistake = async () => {
      try {
        await api.recordMistake({
          word_id: `typo_${currentIndex}`,
          word: currentQuestion.correctChar,
          user_input: `易错点: ${currentQuestion.wrongChar}`
        });
      } catch (e) {
        console.error("Failed to record mistake", e);
      }
    };
    recordMistake();
  };

  const nextQuestion = () => {
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStatus('idle');
      setTimeLeft(15);
      setShowExplanation(false);
    } else {
      setShowResult(true);
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
          <Search size={48} className="text-sunny-orange" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">诊疗完成！</h2>
        <p className="text-gray-400 font-medium mb-8">怪兽的防御属性得到修复</p>
        
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
        <AlertTriangle size={200} className="text-sunny-orange" />
      </div>

      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-sunny-orange-50 rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex flex-col items-center">
          <MonsterReaction status={status} />
          <span className="text-[10px] font-black text-sunny-orange-300 uppercase tracking-[0.2em] mt-2">易错字诊所</span>
        </div>
        <div className="flex items-center space-x-2 bg-sunny-orange-50 px-3 py-1.5 rounded-full">
          <Timer size={14} className="text-sunny-orange" />
          <span className={`text-xs font-black ${timeLeft <= 5 ? 'text-sunny-orange animate-pulse' : 'text-sunny-orange'}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 z-10 space-y-6">
        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-sunny-orange-50 shadow-xl shadow-sunny-orange-100/20 relative min-h-[180px] flex flex-col items-center justify-center mt-4 group">
          <div className="absolute inset-0 bg-sunny-orange-50/30 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Scanning Line */}
          {!showExplanation && (
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-4 right-4 h-0.5 bg-sunny-orange-400/20 z-0 pointer-events-none"
            />
          )}

          <p className="text-xl font-bold text-gray-800 leading-relaxed text-center px-2 z-10">
            {currentQuestion.text.split('').map((char, i) => {
              const isWrongPart = currentQuestion.text.substring(i, i + currentQuestion.wrongChar.length) === currentQuestion.wrongChar;
              const isInWrongPart = Array.from({length: currentQuestion.wrongChar.length}).some((_, offset) => {
                const start = i - offset;
                return start >= 0 && currentQuestion.text.substring(start, start + currentQuestion.wrongChar.length) === currentQuestion.wrongChar;
              });

              return (
                <motion.span 
                  key={i}
                  whileHover={!showExplanation ? { scale: 1.2, color: '#FF8C42' } : {}}
                  onClick={() => !showExplanation && isWrongPart && handleCorrect()}
                  className={`cursor-pointer transition-all inline-block relative ${
                    showExplanation && isInWrongPart ? (status === 'correct' ? 'text-sunny-orange underline decoration-2' : 'text-gray-400 line-through decoration-2') : ''
                  }`}
                >
                  {char}
                  {showExplanation && isInWrongPart && status === 'wrong' && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-sunny-orange text-white px-1.5 py-0.5 rounded font-black">
                      {currentQuestion.correctChar}
                    </span>
                  )}
                </motion.span>
              );
            })}
          </p>
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[2rem] border shadow-sm backdrop-blur-md ${
                status === 'correct' ? 'bg-sunny-orange-50/80 border-sunny-orange-100' : 'bg-white/80 border-gray-100'
              }`}
            >
              <div className="flex items-start space-x-3">
                {status === 'correct' ? <CheckCircle2 className="text-sunny-orange shrink-0" size={20} /> : <XCircle className="text-gray-400 shrink-0" size={20} />}
                <div className="flex-1">
                  <div className={`text-xs font-black mb-1.5 ${status === 'correct' ? 'text-sunny-orange-700' : 'text-gray-700'}`}>
                    {status === 'correct' ? '太棒了！找对了' : '哎呀，没找对或超时了'}
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium leading-relaxed bg-white/40 p-2 rounded-xl border border-white/60">
                    <span className="font-bold text-gray-800">正确写法：</span>
                    <span className="text-sunny-orange-600 font-black mx-1">{currentQuestion.correctChar}</span>
                    <div className="mt-1 text-gray-500 italic border-t border-gray-100 pt-1">
                      {currentQuestion.explanation}
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
            {currentIndex < MOCK_QUESTIONS.length - 1 ? '下一题' : '查看结果'}
          </button>
        ) : (
          <div className="text-center text-gray-400 text-[10px] font-black uppercase tracking-widest animate-pulse py-2">
            请点击句子中错误的字词
          </div>
        )}

        <div className="p-4 bg-white/50 backdrop-blur-md rounded-3xl border border-white/50">
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>诊疗进度</span>
            <span>{currentIndex + 1} / {MOCK_QUESTIONS.length}</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-sunny-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / MOCK_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypoClinic;