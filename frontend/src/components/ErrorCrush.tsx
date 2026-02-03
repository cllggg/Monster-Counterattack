import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gamepad2, Sparkles, Heart, Zap, Trophy, AlertCircle, RefreshCcw, Check } from 'lucide-react';
import { api } from '../services/api';
import { MOCK_WORDS } from '../data/words';

interface Mistake {
  word_id: string;
  word: string;
  user_input: string;
  timestamp: string;
}

interface GameQuestion {
  word: string;
  options: string[];
  correct: string;
  userInput: string; // 用户当时的错误输入，作为强力干扰项
  meaning: string;   // 单词含义，作为解题线索
}

interface ErrorCrushProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

const MonsterReaction = ({ status }: { status: 'correct' | 'wrong' | 'idle' }) => {
  return (
    <motion.div 
      animate={status === 'correct' ? { 
        scale: [1, 1.3, 1],
        rotate: [0, 15, -15, 0],
        filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
      } : status === 'wrong' ? { 
        x: [0, -10, 10, -10, 10, 0],
        scale: [1, 0.8, 1],
        opacity: [1, 0.5, 1]
      } : {
        y: [0, -5, 0]
      }}
      transition={status === 'idle' ? { duration: 2, repeat: Infinity } : { duration: 0.5 }}
      className="text-4xl"
    >
      {status === 'correct' ? '👾' : status === 'wrong' ? '💀' : '👾'}
    </motion.div>
  );
};

const ErrorCrush: React.FC<ErrorCrushProps> = ({ onBack, onComplete }) => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [gameMistakes, setGameMistakes] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const data = await api.getMistakes();
        setMistakes(data);
        prepareGame(data);
      } catch (error) {
        console.error('Failed to fetch mistakes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, []);

  const prepareGame = (data: Mistake[]) => {
    if (data.length < 3) return;

    // 随机选取错题
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, data.length));
    
    const gameData: GameQuestion[] = selected.map(m => {
      // 提取用户当时的错误输入
      let wrongInput = m.user_input || '';
      let type: 'word' | 'typo' | 'sentence' = 'word';
      
      if (wrongInput.includes('易错点: ')) {
        wrongInput = wrongInput.replace('易错点: ', '');
        type = 'typo';
      } else if (wrongInput.includes('我的修改: ')) {
        wrongInput = wrongInput.replace('我的修改: ', '');
        type = 'sentence';
      }

      // 核心选项：1个正确答案 + 1个用户之前的错误选项
      const optionsSet = new Set<string>();
      optionsSet.add(m.word);
      if (wrongInput && wrongInput !== m.word) {
        optionsSet.add(wrongInput);
      }
      
      // 根据类型生成不同的提示信息
      let meaning = '';
      if (type === 'typo') {
        meaning = '请从以下选项中选出正确的写法（修复易错字）';
      } else if (type === 'sentence') {
        meaning = '请选出修复后的正确句子（手术大成功）';
      } else {
        meaning = MOCK_WORDS.find(w => w.id === m.word_id)?.meaning || '请根据读音或含义选择正确写法';
      }
      
      // 干扰项逻辑：如果是句子，需要更智能的干扰
      if (type === 'sentence') {
        // 如果是句子，干扰项可以是其他错题里的句子，或者原句的微调
        const otherSentences = data
          .filter(item => item.user_input.includes('我的修改: ') && item.word !== m.word)
          .map(o => o.word);
        
        const shuffledOthers = otherSentences.sort(() => 0.5 - Math.random());
        for (const other of shuffledOthers) {
          if (optionsSet.size >= 4) break;
          optionsSet.add(other);
        }
      } else {
        // 词语干扰项
        const otherWords = data
          .filter(item => !item.user_input.includes('我的修改: ') && item.word !== m.word && item.word !== wrongInput)
          .map(o => o.word);
        
        const shuffledOthers = otherWords.sort(() => 0.5 - Math.random());
        for (const other of shuffledOthers) {
          if (optionsSet.size >= 4) break;
          optionsSet.add(other);
        }
      }

      // 兜底补充
      const fallback = type === 'sentence' 
        ? ["这是一个错误的干扰项。", "请仔细辨析句子逻辑。", "注意主谓宾是否残缺。"] 
        : ["正确", "错误", "干扰", "雷达"];
      for (const word of fallback) {
        if (optionsSet.size >= 4) break;
        optionsSet.add(word);
      }

      return {
        word: m.word,
        correct: m.word,
        userInput: wrongInput,
        meaning: meaning,
        options: Array.from(optionsSet).sort(() => 0.5 - Math.random())
      };
    });

    setGameMistakes(gameData);
  };

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null || isCorrect !== null) return;
    
    setSelectedOption(index);
    const selectedText = gameMistakes[currentIndex].options[index];
    const correctText = gameMistakes[currentIndex].correct;
    const isCorrectChoice = selectedText === correctText;
    setIsCorrect(isCorrectChoice);

    if (isCorrectChoice) {
      setScore(prev => prev + 10);
    } else {
      setLives(prev => prev - 1);
    }

    // 延迟跳转，让用户看清楚正确答案
    setTimeout(() => {
      if (!isCorrectChoice && lives <= 1) {
        setGameState('end');
      } else if (currentIndex < gameMistakes.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setGameState('end');
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50">
        <div className="w-12 h-12 border-4 border-sunny-orange-100 border-t-sunny-orange rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-bold">同步错题核心...</p>
      </div>
    );
  }

  if (mistakes.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center">
        <div className="w-20 h-20 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-sunny-orange-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">能量漏洞不足</h2>
        <p className="text-gray-400 mb-8 px-6 text-sm">“错题消消乐”需要至少 3 条错题记录才能开启。快去“基础堡垒”修炼吧！</p>
        <button 
          onClick={onBack}
          className="w-full py-4 bg-sunny-orange text-white rounded-2xl font-black shadow-lg shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95"
        >
          返回基地
        </button>
      </div>
    );
  }

  if (gameState === 'start') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center"
      >
        <div className="w-24 h-24 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6 relative">
          <Gamepad2 size={48} className="text-sunny-orange" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-sunny-orange-100 rounded-full -z-10"
          />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">错题消消乐</h2>
        <p className="text-gray-400 font-medium mb-8">修复能量漏洞，夺回怪兽之力</p>
        
        <div className="space-y-4 w-full mb-8">
          <div className="bg-sunny-orange-50/50 backdrop-blur-sm p-5 rounded-3xl border border-sunny-orange-100 text-left">
            <h4 className="text-sunny-orange-600 font-black text-xs uppercase tracking-widest mb-2 flex items-center">
              <Sparkles size={14} className="mr-2" /> 修复指南
            </h4>
            <ul className="text-[11px] text-gray-600 space-y-2 font-medium">
              <li className="flex items-start">
                <span className="text-sunny-orange-400 mr-2">•</span>
                <div className="leading-relaxed">
                  系统将展示你曾经出错的内容，请从中选出<span className="text-sunny-orange-600 font-bold mx-1">正确</span>的写法。
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-sunny-orange-400 mr-2">•</span>
                干扰项中包含你曾经提交过的错误答案，请保持警惕！
              </li>
              <li className="flex items-start">
                <span className="text-sunny-orange-400 mr-2">•</span>
                每次修复成功 +10 能量值，错误将消耗 1 点生命值。
              </li>
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 shadow-sm">
              <Heart size={16} className="text-sunny-orange" />
              <span className="text-[10px] font-black text-gray-500">3 条生命</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 shadow-sm">
              <Zap size={16} className="text-sunny-orange-400" />
              <span className="text-[10px] font-black text-gray-500">经验奖励</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setGameState('playing')}
          className="w-full py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95"
        >
          开始修复
        </button>
      </motion.div>
    );
  }

  if (gameState === 'end') {
    const gainedExp = Math.floor(score * (lives / 3));
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center"
      >
        <div className="w-24 h-24 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6 relative">
          <Trophy size={48} className="text-sunny-orange" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-sunny-orange-100 rounded-full -z-10"
          />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">消消乐：漏洞修补</h2>
        <p className="text-gray-400 font-bold text-sm mb-8">感知领域正在重新扩张</p>
        
        <div className="bg-sunny-orange-50/50 backdrop-blur-sm rounded-3xl p-6 w-full mb-8 border border-sunny-orange-100/50">
          <div className="text-[10px] text-sunny-orange-600 font-black uppercase tracking-[0.2em] mb-1">获得能量 (EXP)</div>
          <div className="text-5xl font-black text-sunny-orange">+{gainedExp}</div>
        </div>

        <button 
          onClick={() => onComplete(gainedExp)}
          className="w-full py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <Zap size={20} />
          <span>注入能量核心</span>
        </button>
      </motion.div>
    );
  }

  const currentQ = gameMistakes[currentIndex];

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-sunny-orange-50 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10">
        <button onClick={onBack} className="p-3 hover:bg-sunny-orange-50 rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex items-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={18} 
              className={i < lives ? "text-sunny-orange fill-sunny-orange" : "text-gray-200"} 
            />
          ))}
        </div>
        <div className="bg-sunny-orange-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-sunny-orange font-black text-xs border border-sunny-orange-100">
          Score: {score}
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <MonsterReaction status={isCorrect === true ? 'correct' : isCorrect === false ? 'wrong' : 'idle'} />
          </div>
          <span className="text-[10px] font-black text-sunny-orange-300 uppercase tracking-[0.2em] mb-2 block">漏洞修复中</span>
          <h3 className="text-sm font-black text-gray-800 mb-2">请从下方选出该词语的<span className="text-sunny-orange-500 mx-1 underline underline-offset-4 decoration-sunny-orange-200">正确写法</span></h3>
          <p className="text-[10px] text-gray-400 font-medium mb-6">干扰项中隐藏着你曾经的错误输入</p>
          <div className="relative inline-block w-full px-4">
            <motion.div 
              key={currentIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full min-h-[120px] bg-white/50 backdrop-blur-md rounded-[2rem] border border-sunny-orange-100 flex flex-col items-center justify-center p-6 shadow-inner relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {selectedOption === null ? (
                  <motion.div
                    key="meaning"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="flex items-center space-x-2 mb-4 bg-sunny-orange-500/10 px-4 py-1.5 rounded-full">
                      <AlertCircle size={14} className="text-sunny-orange" />
                      <span className="text-[11px] font-black text-sunny-orange uppercase tracking-widest">能量漏洞：等待修复</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-gray-400 uppercase tracking-tighter">根据以下释义找回正确写法</p>
                      <p className="text-lg font-black text-gray-800 leading-relaxed px-4">
                        {currentQ.meaning}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="feedback"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    {isCorrect ? (
                      <>
                        <div className="text-5xl mb-2">✅</div>
                        <div className="text-xs font-black text-sunny-orange uppercase tracking-widest">漏洞已封堵</div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl mb-2">❌</div>
                        <div className="text-xs font-black text-sunny-orange uppercase tracking-widest">修复失败</div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* 背景装饰 */}
              <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
                <RefreshCcw size={80} />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {currentQ.options.map((opt, i) => {
            const isThisCorrect = opt === currentQ.correct;
            const isThisSelected = selectedOption === i;
            const isThisWrongInput = opt === currentQ.userInput;
            
            let btnClass = "bg-white/70 backdrop-blur-sm border-white/50 text-gray-700 hover:border-sunny-orange-200 shadow-sm";
            if (selectedOption !== null) {
              if (isThisCorrect) {
                btnClass = "bg-sunny-orange border-sunny-orange text-white shadow-lg shadow-sunny-orange-100 scale-105 z-20";
              } else if (isThisSelected) {
                btnClass = "bg-sunny-orange-200 border-sunny-orange-200 text-white shadow-lg shadow-sunny-orange-50 scale-95 opacity-80";
              } else {
                btnClass = "bg-gray-50/50 border-gray-50/50 text-gray-300 opacity-40 scale-90";
              }
            }

            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick(i)}
                disabled={selectedOption !== null}
                className={`py-6 px-2 rounded-[2rem] font-bold transition-all border-2 relative overflow-hidden ${btnClass}`}
              >
                <span className="relative z-10 text-base">{opt}</span>
                
                {/* 干扰项逻辑指引：只有在答错或者答对后展示，明确告诉用户干扰项是什么 */}
                {selectedOption !== null && isThisWrongInput && !isThisCorrect && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-sunny-orange-600/90 flex flex-col items-center justify-center z-20 text-white"
                  >
                    <AlertCircle size={16} className="mb-1" />
                    <span className="text-[9px] font-black uppercase leading-none">这是你之前的</span>
                    <span className="text-[9px] font-black uppercase leading-none">错误输入</span>
                  </motion.div>
                )}
                
                {/* 正确答案指引 */}
                {selectedOption !== null && isThisCorrect && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-1 right-3"
                  >
                    <Check size={12} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {selectedOption === null && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8 text-[11px] text-gray-400 font-medium animate-pulse"
          >
            提示：观察选项，避开你曾经提交过的错误答案
          </motion.p>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50">
        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
          <span>修复进度</span>
          <span>{currentIndex + 1} / {gameMistakes.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-sunny-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / gameMistakes.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ErrorCrush;