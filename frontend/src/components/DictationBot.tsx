import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowLeft, CheckCircle2, XCircle, Sparkles, Keyboard, Pencil, Shield, Gamepad2, Layers } from 'lucide-react';
import { api } from '../services/api';
import { MOCK_WORDS } from '../data/words';
import HandwritingPad from './HandwritingPad';
import ErrorCrush from './ErrorCrush';

interface DictationBotProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

type InputMode = 'keyboard' | 'handwriting';
type ViewMode = 'dictation' | 'error-crush' | 'grouping';

const DictationBot: React.FC<DictationBotProps> = ({ onBack, onComplete }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dictation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('handwriting');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'recognizing'>('idle');
  const [showResult, setShowResult] = useState(false);
  const [totalExp, setTotalExp] = useState(0);
  
  const currentWord = MOCK_WORDS[currentIndex];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewMode === 'dictation') {
      speakWord(currentWord.word);
    }
  }, [currentIndex, viewMode]);

  const speakWord = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const MonsterReaction = ({ status }: { status: string }) => {
    return (
      <motion.div 
        animate={status === 'correct' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : 
                 status === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-6xl mb-4"
      >
        {status === 'correct' ? '🤩' : status === 'wrong' ? '😵' : status === 'recognizing' ? '🤔' : '👾'}
      </motion.div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    if (userInput.trim() === currentWord.word) {
      setStatus('correct');
      setTotalExp(prev => prev + 20);
      setTimeout(() => nextWord(), 1500);
    } else {
      setStatus('wrong');
      const recordMistake = async () => {
        try {
          await api.recordMistake({
            word_id: currentWord.id,
            word: currentWord.word,
            user_input: userInput.trim()
          });
        } catch (e) {
          console.error("Failed to record mistake", e);
        }
      };
      recordMistake();
      
      setTimeout(() => {
        setStatus('idle');
        setUserInput('');
        inputRef.current?.focus();
      }, 2000);
    }
  };

  const handleHandwritingConfirm = async (svgPath: string) => {
    setStatus('recognizing');
    
    try {
      const data = await api.verifyHandwriting({
        svg_path: svgPath,
        target_word: currentWord.word
      });
      
      if (data.is_correct) {
        setStatus('correct');
        setTotalExp(prev => prev + 25);
        setTimeout(() => nextWord(), 1500);
      } else {
        setStatus('wrong');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Handwriting verification failed:', error);
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const nextWord = () => {
    if (currentIndex < MOCK_WORDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setStatus('idle');
    } else {
      setShowResult(true);
    }
  };

  // Grouping Game Logic
  const [groupingChars, setGroupingChars] = useState<string[]>([]);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [groupingStatus, setGroupingStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const targetIdiom = "守株待兔";

  useEffect(() => {
    const chars = "守株待兔狐假虎威画蛇添足".split('').sort(() => 0.5 - Math.random());
    setGroupingChars(chars);
  }, []);

  const handleCharSelect = (char: string) => {
    if (selectedChars.length < 4) {
      setSelectedChars(prev => [...prev, char]);
    }
  };

  const checkGrouping = () => {
    if (selectedChars.join('') === targetIdiom) {
      setGroupingStatus('correct');
      setTotalExp(prev => prev + 30);
    } else {
      setGroupingStatus('wrong');
      setTimeout(() => {
        setSelectedChars([]);
        setGroupingStatus('idle');
      }, 1500);
    }
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center"
      >
        <div className="w-24 h-24 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6 relative">
          <Sparkles size={48} className="text-sunny-orange" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-sunny-orange-100 rounded-full -z-10"
          />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">基础堡垒：防御升级</h2>
        <p className="text-gray-400 font-bold text-sm mb-8">能量核心的厚度正在增加</p>
        
        <div className="bg-sunny-orange-50/50 backdrop-blur-md rounded-3xl p-6 w-full mb-8 border border-sunny-orange-100/50">
          <div className="text-[10px] text-sunny-orange-600 font-black uppercase tracking-[0.2em] mb-1">获得能量 (EXP)</div>
          <div className="text-5xl font-black text-sunny-orange">+{totalExp}</div>
        </div>

        <button 
          onClick={() => onComplete(totalExp)}
          className="w-full py-5 bg-sunny-orange text-white rounded-[2rem] font-black shadow-xl shadow-sunny-orange-100 hover:bg-sunny-orange-600 transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <Shield size={20} />
          <span>注入能量核心</span>
        </button>
      </motion.div>
    );
  }

  if (viewMode === 'error-crush') {
    return <ErrorCrush onBack={() => setViewMode('dictation')} onComplete={onComplete} />;
  }

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-sunny-orange-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Shield size={200} />
      </div>

      <div className="flex items-center justify-between mb-8 z-10">
        <button onClick={onBack} className="p-3 hover:bg-sunny-orange-50 rounded-2xl transition-colors group">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-sunny-orange" />
        </button>
        
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('dictation')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'dictation' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
          >
            听写训练
          </button>
          <button 
            onClick={() => setViewMode('grouping')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'grouping' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
          >
            组词挑战
          </button>
        </div>

        <button 
          onClick={() => setViewMode('error-crush')}
          className="p-3 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors text-red-400"
          title="错题消消乐"
        >
          <Gamepad2 size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 -mt-4 w-full">
        {viewMode === 'dictation' ? (
            <>
                <MonsterReaction status={status} />
                
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => speakWord(currentWord.word)}
                className="w-20 h-20 bg-sunny-orange rounded-3xl flex items-center justify-center shadow-xl shadow-sunny-orange-100 mb-2 group relative"
                >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity" />
                <Volume2 size={28} className="text-white" />
                </motion.button>
                <p className="text-[10px] text-gray-400 font-bold mb-6">点击重听单词</p>

                {inputMode === 'keyboard' ? (
                <form onSubmit={handleSubmit} className="w-full space-y-4 max-w-sm">
                    <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="在此输入拼写..."
                        className={`w-full py-4 px-6 bg-white/50 backdrop-blur-sm rounded-[1.5rem] text-center text-xl font-black text-gray-800 border-2 transition-all outline-none ${
                        status === 'correct' ? 'border-sunny-orange bg-sunny-orange-50/50' : 
                        status === 'wrong' ? 'border-sunny-orange-200 bg-sunny-orange-50/20' : 
                        'border-transparent focus:border-sunny-orange/20'
                        }`}
                        autoFocus
                    />
                    <AnimatePresence>
                        {status === 'correct' && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -right-2 -top-2 bg-sunny-orange text-white p-1.5 rounded-full shadow-lg shadow-sunny-orange-200"
                        >
                            <CheckCircle2 size={18} />
                        </motion.div>
                        )}
                        {status === 'wrong' && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -right-2 -top-2 bg-sunny-orange-200 text-white p-1.5 rounded-full shadow-lg"
                        >
                            <XCircle size={18} />
                        </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                    
                    <button
                    type="submit"
                    disabled={status !== 'idle' || !userInput.trim()}
                    className="w-full py-4 bg-sunny-orange text-white rounded-[1.5rem] font-black shadow-lg shadow-sunny-orange-100 hover:shadow-sunny-orange-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                    提交核对
                    </button>
                </form>
                ) : (
                <div className="w-full relative max-w-sm">
                    <div className={`relative rounded-[2.5rem] p-3 border-2 transition-all duration-300 ${
                    status === 'recognizing' ? 'border-sunny-orange border-dashed animate-pulse bg-sunny-orange-50/30' : 
                    status === 'correct' ? 'border-sunny-orange bg-sunny-orange-50/50' : 
                    status === 'wrong' ? 'border-sunny-orange-200 bg-sunny-orange-50/20' :
                    'border-gray-100/50 bg-white/50 backdrop-blur-sm'
                    }`}>
                    <HandwritingPad 
                        status={status}
                        onClear={() => {
                        if (status === 'idle') setStatus('idle');
                        }}
                        onConfirm={handleHandwritingConfirm}
                    />
                    
                    <AnimatePresence>
                        {status === 'recognizing' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md rounded-[2.5rem] z-20"
                        >
                            <div className="w-12 h-12 border-4 border-sunny-orange/20 border-t-sunny-orange rounded-full animate-spin mb-3" />
                            <span className="text-[10px] font-black text-sunny-orange uppercase tracking-widest">AI 识别中...</span>
                        </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-bold mt-4">请在上方区域手写拼写</p>
                </div>
                )}

                 {/* Bottom Switcher */}
                <div className="mt-8 flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl z-10 w-full max-w-[200px]">
                    <button
                    onClick={() => setInputMode('keyboard')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs transition-all ${
                        inputMode === 'keyboard' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    >
                    <Keyboard size={16} />
                    <span>键盘输入</span>
                    </button>
                    <button
                    onClick={() => setInputMode('handwriting')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs transition-all ${
                        inputMode === 'handwriting' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    >
                    <Pencil size={16} />
                    <span>手写识别</span>
                    </button>
                </div>
            </>
        ) : (
            <div className="w-full max-w-sm">
                <div className="bg-sunny-orange-50 rounded-2xl p-6 text-center mb-6">
                    <p className="text-gray-500 text-sm mb-2">请找出成语：</p>
                    <h3 className="text-2xl font-black text-gray-800 tracking-widest">守株待兔</h3>
                </div>

                <div className="flex justify-center space-x-2 mb-6 h-16">
                    {selectedChars.map((char, i) => (
                        <div key={i} className="w-12 h-12 bg-white border-2 border-sunny-orange rounded-xl flex items-center justify-center text-xl font-black text-gray-800 shadow-sm">
                            {char}
                        </div>
                    ))}
                    {[...Array(4 - selectedChars.length)].map((_, i) => (
                         <div key={`empty-${i}`} className="w-12 h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl" />
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-3 mb-8">
                    {groupingChars.map((char, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCharSelect(char)}
                            className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-sunny-orange-50 hover:text-sunny-orange transition-colors"
                        >
                            {char}
                        </motion.button>
                    ))}
                </div>

                <div className="flex space-x-3">
                    <button 
                        onClick={() => setSelectedChars([])}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black"
                    >
                        重置
                    </button>
                    <button 
                        onClick={checkGrouping}
                        className={`flex-1 py-4 text-white rounded-2xl font-black shadow-lg transition-all ${
                            groupingStatus === 'correct' ? 'bg-green-500 shadow-green-200' :
                            groupingStatus === 'wrong' ? 'bg-red-500 shadow-red-200' :
                            'bg-sunny-orange shadow-sunny-orange-200'
                        }`}
                    >
                        {groupingStatus === 'correct' ? '正确！' : groupingStatus === 'wrong' ? '错误' : '确认'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DictationBot;
