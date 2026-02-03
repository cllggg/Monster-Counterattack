import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import { MOCK_WORDS } from '../data/words';

interface WordMatchingProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

const WordMatching: React.FC<WordMatchingProps> = ({ onBack, onComplete }) => {
  const [stage, setStage] = useState<'matching' | 'combination'>('matching');
  const [words, setWords] = useState<any[]>([]);
  const [meanings, setMeanings] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{wordId: string, meaningId: string} | null>(null);
  
  // 组词挑战相关状态
  const [comboWord, setComboWord] = useState<{target: string, parts: string[]} | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const MonsterReaction = ({ status }: { status: string }) => {
    return (
      <motion.div 
        animate={status === 'correct' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : 
                 status === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-4xl"
      >
        {status === 'correct' ? '🛡️' : status === 'wrong' ? '💢' : '🏰'}
      </motion.div>
    );
  };

  useEffect(() => {
    initMatching();
  }, []);

  const initMatching = () => {
    const shuffled = [...MOCK_WORDS].sort(() => 0.5 - Math.random()).slice(0, 4);
    setWords(shuffled.map(w => ({ id: w.id, text: w.word })));
    setMeanings([...shuffled].sort(() => 0.5 - Math.random()).map(w => ({ id: w.id, text: w.meaning })));
    setMatches([]);
    setStage('matching');
  };

  const initCombination = () => {
    const targetWord = MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)];
    const parts = targetWord.word.split('');
    // 添加一些干扰项
    const distractors = ['辨', '辩', '智', '慧', '逆', '袭', '堡', '垒'].filter(c => !parts.includes(c));
    const shuffledParts = [...parts, ...distractors.slice(0, 4 - parts.length)].sort(() => 0.5 - Math.random());
    
    setComboWord({ target: targetWord.word, parts: shuffledParts });
    setSelectedParts([]);
    setStage('combination');
  };

  const handleWordClick = (id: string) => {
    if (matches.includes(id)) return;
    setSelectedWord(id);
    if (selectedMeaning) {
      checkMatch(id, selectedMeaning);
    }
  };

  const handleMeaningClick = (id: string) => {
    if (matches.includes(id)) return;
    setSelectedMeaning(id);
    if (selectedWord) {
      checkMatch(selectedWord, id);
    }
  };

  const checkMatch = (wordId: string, meaningId: string) => {
    if (wordId === meaningId) {
      setMatches(prev => [...prev, wordId]);
      setSelectedWord(null);
      setSelectedMeaning(null);
      setStatus('correct');
      setTimeout(() => setStatus('idle'), 1000);
      
      if (matches.length + 1 === words.length) {
        setTimeout(() => initCombination(), 1000);
      }
    } else {
      setWrongMatch({ wordId, meaningId });
      setStatus('wrong');
      
      // 记录错题到后端
      const recordMistake = async () => {
        try {
          const wordObj = words.find(w => w.id === wordId);
          // const meaningObj = meanings.find(m => m.id === meaningId); // Unused currently in API call but good for context
          
          if (wordObj) {
            await api.recordMistake({
              word_id: wordObj.id,
              word: wordObj.text,
              user_input: `[连线错误] 选择了: ${meaningId}` // Simply logging the wrong choice ID or we can find the meaning text
            });
          }
        } catch (e) {
          console.error("Failed to record mistake", e);
        }
      };
      recordMistake();

      setTimeout(() => {
        setWrongMatch(null);
        setSelectedWord(null);
        setSelectedMeaning(null);
        setStatus('idle');
      }, 1000);
    }
  };

  const handlePartClick = (part: string) => {
    if (status !== 'idle') return;
    
    const newSelected = [...selectedParts, part];
    setSelectedParts(newSelected);

    if (newSelected.length === comboWord?.target.length) {
      if (newSelected.join('') === comboWord?.target) {
        setStatus('correct');
        setTimeout(() => setShowResult(true), 1500);
      } else {
        setStatus('wrong');
        setTimeout(() => {
          setSelectedParts([]);
          setStatus('idle');
        }, 1500);
      }
    }
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full bg-white rounded-[3rem] p-8 shadow-2xl border border-sunny-orange-50 text-center"
      >
        <div className="w-24 h-24 bg-sunny-orange-50 rounded-full flex items-center justify-center mb-6 relative">
          <Shield size={48} className="text-sunny-orange" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-sunny-orange-100 rounded-full -z-10"
          />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">词义连线：防御加固</h2>
        <p className="text-gray-400 font-bold text-sm mb-8">怪兽的基础防线更加坚不可摧</p>
        
        <div className="bg-sunny-orange-50 rounded-3xl p-6 w-full mb-8 border border-sunny-orange-100/50">
          <div className="text-[10px] text-sunny-orange-600 font-black uppercase tracking-[0.2em] mb-1">获得能量 (EXP)</div>
          <div className="text-5xl font-black text-sunny-orange">+40</div>
        </div>

        <button 
          onClick={() => onComplete(40)}
          className="w-full py-5 bg-gray-800 text-white rounded-[2rem] font-black shadow-xl shadow-gray-200 hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <Shield size={20} />
          <span>注入能量核心</span>
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Shield size={200} />
      </div>

      <div className="flex items-center justify-between mb-8 z-10">
        <button onClick={onBack} className="p-3 hover:bg-white/50 rounded-2xl transition-colors backdrop-blur-sm">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex flex-col items-center">
          <MonsterReaction status={status} />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-2">
            {stage === 'matching' ? '知识采撷：词义连线' : '知识采撷：组词大挑战'}
          </span>
        </div>
        <div className="w-12" />
      </div>

      <AnimatePresence mode="wait">
        {stage === 'matching' ? (
          <motion.div 
            key="matching"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 grid grid-cols-2 gap-6 z-10 px-2 overflow-y-auto custom-scrollbar"
          >
            {/* Words Column */}
            <div className="flex flex-col space-y-4">
              <div className="text-[10px] text-gray-300 font-black uppercase tracking-widest text-center mb-2 sticky top-0 bg-white/40 backdrop-blur-md py-1 rounded-full">核心词汇</div>
              {words.map((w) => {
                const isMatched = matches.includes(w.id);
                const isSelected = selectedWord === w.id;
                const isWrong = wrongMatch?.wordId === w.id;
                
                return (
                  <motion.button
                    key={w.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWordClick(w.id)}
                    disabled={isMatched}
                    className={`w-full h-24 rounded-3xl font-black text-xl transition-all border-2 flex items-center justify-center shrink-0 ${
                      isMatched ? 'bg-gray-50/50 border-gray-100/50 text-gray-200' :
                      isWrong ? 'bg-red-50/80 border-red-400 text-red-500 shadow-lg' :
                      isSelected ? 'bg-sunny-orange border-sunny-orange text-white shadow-xl shadow-sunny-orange-100' :
                      'bg-white/60 border-gray-100 text-gray-700 shadow-sm hover:border-sunny-orange-100'
                    }`}
                  >
                    {w.text}
                  </motion.button>
                );
              })}
            </div>

            {/* Meanings Column */}
            <div className="flex flex-col space-y-4">
              <div className="text-[10px] text-gray-300 font-black uppercase tracking-widest text-center mb-2 sticky top-0 bg-white/40 backdrop-blur-md py-1 rounded-full">深层义项</div>
              {meanings.map((m) => {
                const isMatched = matches.includes(m.id);
                const isSelected = selectedMeaning === m.id;
                const isWrong = wrongMatch?.meaningId === m.id;

                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMeaningClick(m.id)}
                    disabled={isMatched}
                    className={`w-full h-24 px-4 rounded-3xl font-bold text-xs leading-relaxed transition-all border-2 flex items-center justify-center shrink-0 ${
                      isMatched ? 'bg-gray-50/50 border-gray-100/50 text-gray-200' :
                      isWrong ? 'bg-gray-50 border-gray-200 text-gray-400 shadow-inner' :
                      isSelected ? 'bg-sunny-orange border-sunny-orange text-white shadow-xl shadow-sunny-orange-100' :
                      'bg-white/60 border-gray-100 text-gray-700 shadow-sm hover:border-sunny-orange-100'
                    }`}
                  >
                    {m.text}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="combination"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center justify-center z-10 space-y-12"
          >
            <div className="text-center space-y-4">
              <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">请组合出以下词语</h3>
              <div className="text-5xl font-black text-gray-800 tracking-tighter">
                {comboWord?.target.split('').map((_, i) => (
                  <span key={i} className={`inline-block w-16 h-20 border-b-4 mx-1 transition-all ${selectedParts[i] ? 'border-sunny-orange text-sunny-orange' : 'border-gray-200 text-transparent'}`}>
                    {selectedParts[i] || '?'}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              {comboWord?.parts.map((part, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePartClick(part)}
                  className="h-20 bg-white/60 backdrop-blur-sm border-2 border-gray-100 rounded-[2rem] text-3xl font-black text-gray-700 shadow-sm hover:border-sunny-orange hover:text-sunny-orange transition-all"
                >
                  {part}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 p-4 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 z-10">
        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>任务进度</span>
          <span>{stage === 'matching' ? `${matches.length} / ${words.length}` : '最后阶段'}</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-sunny-orange"
            initial={{ width: 0 }}
            animate={{ width: stage === 'matching' ? `${(matches.length / words.length) * 100}%` : '100%' }}
          />
        </div>
      </div>
    </div>
  );};

export default WordMatching;
