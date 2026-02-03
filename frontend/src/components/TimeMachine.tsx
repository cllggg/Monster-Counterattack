import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Trash2, AlertCircle, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';

interface Mistake {
  id: string;
  original_question: string;
  wrong_answer: string;
  error_tag: string;
  next_review_date: string;
}

interface TimeMachineProps {
  onBack: () => void;
  onCrushStart: () => void;
}

const TimeMachine: React.FC<TimeMachineProps> = ({ onBack, onCrushStart }) => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMistakes, setShowAllMistakes] = useState(false);
  
  const fetchMistakes = async () => {
    try {
      const data = await api.getMistakes();
      setMistakes(data.reverse());
    } catch (error) {
      console.error('Failed to fetch mistakes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const handleClearMistakes = async () => {
    if (window.confirm('确定要清除所有记忆锦囊中的记录吗？这将无法恢复。')) {
      try {
        await api.clearMistakes();
        setMistakes([]);
      } catch (error) {
        console.error('Failed to clear mistakes:', error);
      }
    }
  };

  const getMistakeType = (m: Mistake) => {
    if (!m.wrong_answer) return { label: '未知', color: 'bg-gray-100 text-gray-400' };
    if (m.error_tag) return { label: m.error_tag.replace('#', ''), color: 'bg-sunny-orange-100 text-sunny-orange-600' };
    return { label: '听写', color: 'bg-sunny-orange-100 text-sunny-orange-600' };
  };

  const displayedMistakes = showAllMistakes ? mistakes : mistakes.slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-sunny-orange" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-sunny-orange uppercase tracking-[0.2em] mb-1">THE ERROR BANK</span>
          <div className="text-sm font-black text-gray-800">时光回溯机</div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6">
        
        {/* Error Crush Entry */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-6 shadow-lg relative overflow-hidden group cursor-pointer" onClick={onCrushStart}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <RefreshCcw size={80} className="text-white animate-spin-slow" />
            </div>
            <div className="relative z-10 flex flex-col items-start space-y-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <RefreshCcw size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">错题消消乐</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">ERROR CRUSH MODE</p>
                </div>
                <button className="px-6 py-3 bg-sunny-orange text-white rounded-xl text-xs font-black shadow-lg shadow-sunny-orange/30 group-hover:scale-105 transition-transform">
                    开启消消乐挑战
                </button>
            </div>
        </div>

        {/* Mistakes Section (The "Mistake Book") */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-sunny-orange-50 rounded-lg">
                <BookOpen size={16} className="text-sunny-orange-400" />
              </div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">记忆锦囊 (Memory Capsule)</h3>
            </div>
            {mistakes.length > 0 && (
              <button 
                onClick={handleClearMistakes}
                className="p-2 text-gray-300 hover:text-sunny-orange-400 transition-colors"
                title="清除记忆锦囊"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-3 opacity-30">
              <div className="w-8 h-8 border-2 border-sunny-orange-200 border-t-sunny-orange rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-gray-400 italic">调取记忆核心...</span>
            </div>
          ) : mistakes.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {displayedMistakes.map((m, i) => {
                  const type = getMistakeType(m);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-sunny-orange-100 hover:bg-sunny-orange-50/30 transition-all"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${type.color}`}>
                            {type.label}
                          </span>
                          <div className="text-xs font-black text-gray-800 truncate">{m.original_question}</div>
                        </div>
                        <div className="text-[10px] text-sunny-orange-400 font-bold opacity-70 truncate">
                          记录值: <span className="italic">{m.wrong_answer || '[未录入]'}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-300 font-medium bg-white px-2 py-1 rounded-lg border border-gray-50 shrink-0">
                        复习: {new Date(m.next_review_date).toLocaleDateString()}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {mistakes.length > 5 && (
                <button 
                  onClick={() => setShowAllMistakes(!showAllMistakes)}
                  className="w-full py-3 text-[10px] font-black text-gray-400 hover:text-sunny-orange transition-colors uppercase tracking-[0.2em]"
                >
                  {showAllMistakes ? '收起部分漏洞' : `展开全部漏洞 (${mistakes.length})`}
                </button>
              )}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center space-y-2 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <AlertCircle size={20} className="text-gray-200" />
              </div>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">记忆锦囊空空如也，继续保持</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeMachine;