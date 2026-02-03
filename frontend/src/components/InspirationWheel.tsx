import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCcw, ArrowRight } from 'lucide-react';

interface WheelProps {
  onComplete: (prompt: string) => void;
}

const RING_1 = ["宇航员", "流浪猫", "会说话的树桩", "小侦探", "魔法师", "机器人"];
const RING_2 = ["火星基地", "海底超市", "云端城堡", "神秘洞穴", "未来学校", "恐龙公园"];
const RING_3 = ["丢了钥匙", "遇到了外星人", "发现时间倒流", "捡到一张藏宝图", "学会了隐身", "拯救了世界"];

const SlotRing = ({ items, spinning, result }: { items: string[], spinning: boolean, result: string | null }) => {
  return (
    <div className="w-full h-32 bg-white rounded-2xl shadow-inner border-4 border-slate-200 overflow-hidden relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        {spinning ? (
          <motion.div
            key="spinning"
            initial={{ y: 0 }}
            animate={{ y: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
            className="flex flex-col items-center space-y-4 absolute"
          >
            {[...items, ...items, ...items].map((item, i) => (
              <div key={i} className="text-xl font-bold text-slate-400 py-2">{item}</div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-2xl font-black text-slate-800 text-center px-4"
          >
            {result || "?"}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Highlight Line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-400/30 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};

const InspirationWheel: React.FC<WheelProps> = ({ onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [results, setResults] = useState<[string | null, string | null, string | null]>([null, null, null]);

  const spin = () => {
    setIsSpinning(true);
    setResults([null, null, null]);

    // Staggered stop
    setTimeout(() => {
      const r1 = RING_1[Math.floor(Math.random() * RING_1.length)];
      setResults(prev => [r1, null, null]);
    }, 1000);

    setTimeout(() => {
      const r2 = RING_2[Math.floor(Math.random() * RING_2.length)];
      setResults(prev => [prev[0], r2, null]);
    }, 2000);

    setTimeout(() => {
      setResults(prev => {
        const r3 = RING_3[Math.floor(Math.random() * RING_3.length)];
        const newResults: [string | null, string | null, string | null] = [prev[0], prev[1], r3];
        setIsSpinning(false);
        // Do not call onComplete here automatically if we want user to see the result first
        return newResults;
      });
    }, 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative lights */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-4 left-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]" />
          <div className="absolute top-4 right-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse delay-75 shadow-[0_0_10px_#fbbf24]" />
          <div className="absolute bottom-4 left-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse delay-150 shadow-[0_0_10px_#fbbf24]" />
          <div className="absolute bottom-4 right-4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse delay-300 shadow-[0_0_10px_#fbbf24]" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-300" />
            灵感大转盘
            <Sparkles className="text-yellow-300" />
          </h2>
          <p className="text-white/60 font-medium mt-2">转动命运齿轮，开启奇幻冒险！</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">主角</span>
            <SlotRing items={RING_1} spinning={isSpinning || (results[0] === null && isSpinning)} result={results[0]} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">地点</span>
            <SlotRing items={RING_2} spinning={isSpinning || (results[1] === null && isSpinning)} result={results[1]} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">事件</span>
            <SlotRing items={RING_3} spinning={isSpinning || (results[2] === null && isSpinning)} result={results[2]} />
          </div>
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={spin}
            disabled={isSpinning}
            className={`
              px-8 py-4 rounded-full text-xl font-black flex items-center gap-3 shadow-xl transition-all
              ${isSpinning 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-orange-500/50'}
            `}
          >
            <RefreshCcw className={`${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? '正在生成...' : '立即旋转'}
          </motion.button>
        </div>
      </div>

      {results[0] && results[1] && results[2] && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-100 flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-purple-500 font-bold uppercase tracking-wider mb-1">你的写作题目</div>
            <div className="text-2xl font-black text-slate-800">
              {results[0]}在{results[1]}{results[2]}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onComplete(`${results[0]}在${results[1]}${results[2]}`)}
            className="p-4 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
          >
            <ArrowRight size={24} />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default InspirationWheel;
