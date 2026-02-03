import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { ArrowLeft, Sword, Zap, User as UserIcon, Ghost } from 'lucide-react';

interface ShadowDuelProps {
  onBack: () => void;
}

const ShadowDuel: React.FC<ShadowDuelProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'matching' | 'playing' | 'result'>('matching');
  const [opponent, setOpponent] = useState<any>(null);
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);

  useEffect(() => {
    // Match opponent
    const match = async () => {
      try {
        const data = await api.matchDuelOpponent("stage_1");
        setOpponent(data);
        setTimeout(() => setGameState('playing'), 2000); // Fake matching delay
      } catch (e) {
        console.error(e);
      }
    };
    match();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && opponent) {
      // Simulate Shadow Playback
      const duration = opponent.duration || 10000; // ms
      const interval = setInterval(() => {
        setOpponentProgress(prev => {
          if (prev >= 100) return 100;
          return prev + (100 / (duration / 100)); // Update every 100ms
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameState, opponent]);

  useEffect(() => {
    if (myProgress >= 100 || opponentProgress >= 100) {
      if (result === null) {
        if (myProgress >= 100) setResult('win');
        else setResult('lose');
        setGameState('result');
        
        // Save my record
        if (myProgress >= 100) {
           api.saveDuelRecord({
               student_id: 'default_user',
               stage_id: 'stage_1',
               score: 100,
               duration: 8000, // Mock duration
               replay_data: []
           });
        }
      }
    }
  }, [myProgress, opponentProgress]);

  const handleAttack = () => {
    if (gameState !== 'playing') return;
    setMyProgress(prev => Math.min(100, prev + 10)); // Click to gain 10% progress (Mock gameplay)
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-[3rem] p-6 shadow-2xl border border-slate-700 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <button onClick={onBack} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <span className="text-sm font-black text-purple-400 tracking-widest uppercase">S4 影子对决</span>
        <div className="w-12" />
      </div>

      {gameState === 'matching' && (
        <div className="flex-1 flex flex-col items-center justify-center">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
             className="mb-4"
           >
             <Sword size={48} className="text-purple-500" />
           </motion.div>
           <div className="text-gray-400">正在匹配时空影子...</div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col justify-center gap-12">
            {/* Opponent (Top) */}
            <div className="relative">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-2"><Ghost size={16}/> {opponent?.student_name} (Lv.?)</span>
                    <span>{Math.round(opponentProgress)}%</span>
                </div>
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-purple-600"
                        style={{ width: `${opponentProgress}%` }}
                    />
                </div>
            </div>

            {/* VS Divider */}
            <div className="text-center font-black text-4xl text-white/20 italic">VS</div>

            {/* Me (Bottom) */}
            <div className="relative">
                 <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-2"><UserIcon size={16}/> 我 (Lv.1)</span>
                    <span>{Math.round(myProgress)}%</span>
                </div>
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-blue-500"
                        style={{ width: `${myProgress}%` }}
                    />
                </div>
            </div>

            {/* Action Area */}
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleAttack}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/50 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <span className="font-black text-xl">攻击!</span>
                </button>
                <div className="absolute bottom-8 text-xs text-gray-500 w-full text-center">点击按钮模拟答题 (Demo)</div>
            </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`text-6xl font-black mb-4 ${result === 'win' ? 'text-yellow-400' : 'text-gray-400'}`}
            >
                {result === 'win' ? 'VICTORY' : 'DEFEAT'}
            </motion.div>
            <div className="text-gray-400 mb-8">
                {result === 'win' ? '+50 EXP' : '+10 EXP (安慰奖)'}
            </div>
            <button onClick={() => setGameState('matching')} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold">
                再战一局
            </button>
        </div>
      )}
    </div>
  );
};

export default ShadowDuel;
