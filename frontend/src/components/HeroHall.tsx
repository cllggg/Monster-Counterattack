import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Target, Shield, Zap, Trophy, Award, Star, Grid, Users, Swords, Crown } from 'lucide-react';
import { api } from '../services/api';

interface HeroHallProps {
  stats: {
    atk: number;
    def: number;
    per: number;
  };
  totalExp: number;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const MONSTER_DEX = [
  { level: 1, name: '混沌初开', icon: '👾', desc: '初生的怪兽，充满潜能' },
  { level: 5, name: '灵光核心', icon: '🦁', desc: '掌握了基础知识，光芒初现' },
  { level: 10, name: '圣域神兽', icon: '🦄', desc: '知识渊博，守护一方' },
  { level: 20, name: '星穹主宰', icon: '🐲', desc: '传说中的存在，通晓万物' }
];

const MonsterReaction = ({ level }: { level: number }) => {
  return (
    <motion.div 
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
        filter: level >= 10 ? ['drop-shadow(0 0 10px rgba(255,215,0,0.5))', 'drop-shadow(0 0 20px rgba(255,215,0,0.8))', 'drop-shadow(0 0 10px rgba(255,215,0,0.5))'] : []
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="text-5xl"
    >
      {level >= 10 ? '🦄' : level >= 5 ? '🦁' : '👾'}
    </motion.div>
  );
};

const HeroHall: React.FC<HeroHallProps> = ({ stats, totalExp, onBack, onNavigate }) => {
  const level = Math.floor(totalExp / 100) + 1;

  const [leaderboard, setLeaderboard] = useState<{rank: number; name: string; exp: number; monster: string; is_momentum?: boolean}[]>([]);
  const [boardType, setBoardType] = useState<'exp' | 'momentum'>('exp');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard(boardType);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, [boardType]);

  const achievements = [
    { id: 1, name: '初露锋芒', desc: '等级达到 2 级', icon: <Star size={16} />, active: level >= 2 },
    { id: 2, name: '基础扎实', desc: '防御力达到 20', icon: <Shield size={16} />, active: stats.def >= 20 },
    { id: 3, name: '百步穿杨', desc: '攻击力达到 20', icon: <Target size={16} />, active: stats.atk >= 20 },
    { id: 4, name: '见微知著', desc: '感知力达到 20', icon: <Zap size={16} />, active: stats.per >= 20 },
    { id: 5, name: '千锤百炼', desc: '累计获得 500 EXP', icon: <Trophy size={16} />, active: totalExp >= 500 },
  ];

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-sunny-orange" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-sunny-orange uppercase tracking-[0.2em] mb-1">SOCIAL & ACHIEVEMENTS</span>
          <div className="text-sm font-black text-gray-800">英雄名人堂</div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-6">
        {/* Level & Form Card */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-sunny-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <TrendingUp size={120} className="text-sunny-orange" />
          </div>
          
          <div className="flex items-center space-x-5 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-sunny-orange rounded-2xl flex items-center justify-center shadow-lg shadow-sunny-orange-100 overflow-hidden">
                <MonsterReaction level={level} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                {level}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-sunny-orange font-black uppercase tracking-widest">Monster Form</div>
              <div className="text-xl font-black text-gray-800">
                {level >= 10 ? '圣域神兽' : level >= 5 ? '灵光核心' : '混沌初开'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: '攻击 (Express)', value: stats.atk, color: 'bg-sunny-orange-600', icon: <Target size={12} /> },
              { label: '防御 (Base)', value: stats.def, color: 'bg-sunny-orange', icon: <Shield size={12} /> },
              { label: '感知 (Perception)', value: stats.per, color: 'bg-sunny-orange-300', icon: <Zap size={12} /> },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{s.icon}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-700">{s.value}</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(s.value, 100)}%` }}
                    className={`h-full ${s.color} rounded-full shadow-sm`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social & Arena Section */}
        <div className="grid grid-cols-2 gap-4">
            {/* Monster Alliance */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3 relative overflow-hidden group hover:border-sunny-orange-100 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/20" />
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-1 group-hover:scale-110 transition-transform">
                    <Users size={20} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-gray-800">怪兽联盟</h3>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">本周目标: 消灭 1W 漏洞</p>
                </div>
                <button className="w-full py-2 bg-blue-50 text-blue-500 rounded-xl text-[9px] font-black hover:bg-blue-100 transition-colors">
                    进入联盟
                </button>
            </div>

            {/* Arena */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3 relative overflow-hidden group hover:border-sunny-orange-100 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-400/20" />
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-1 group-hover:scale-110 transition-transform">
                    <Swords size={20} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-gray-800">竞技场</h3>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">影子对决 (PvP)</p>
                </div>
                <button 
                  onClick={() => onNavigate?.('duel')}
                  className="w-full py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black hover:bg-red-100 transition-colors"
                >
                    寻找对手
                </button>
            </div>
        </div>

        {/* Monster Collection (Pokedex) */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Grid size={16} className="text-purple-500" />
            </div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">怪兽图鉴 (Collection)</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {MONSTER_DEX.map((monster) => {
              const isUnlocked = level >= monster.level;
              return (
                <div key={monster.level} className="flex flex-col items-center group relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-all border-2 ${
                    isUnlocked ? 'bg-purple-50 border-purple-100 text-gray-800 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-300'
                  }`}>
                    {isUnlocked ? monster.icon : '?'}
                  </div>
                  <span className={`text-[8px] font-black text-center ${isUnlocked ? 'text-gray-700' : 'text-gray-300'}`}>
                    {monster.name}
                  </span>
                  {isUnlocked && (
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                       {monster.desc}
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-1.5 bg-yellow-50 rounded-lg">
              <Award size={16} className="text-yellow-500" />
            </div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">荣耀勋章</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {achievements.map((ach) => (
              <div 
                key={ach.id} 
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  ach.active 
                  ? 'bg-yellow-50 border-yellow-100 text-yellow-600 scale-100 opacity-100 shadow-sm' 
                  : 'bg-gray-50 border-gray-100 text-gray-300 scale-95 opacity-50 grayscale'
                }`}
              >
                <div className={`mb-1 ${ach.active ? 'animate-bounce-slow' : ''}`}>
                  {ach.icon}
                </div>
                <span className="text-[9px] font-black text-center whitespace-nowrap">{ach.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-sunny-orange-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users size={18} className="text-sunny-orange" />
              <h3 className="font-black text-gray-800">全球排行榜</h3>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setBoardType('exp')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${boardType === 'exp' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
              >
                总经验
              </button>
              <button 
                onClick={() => setBoardType('momentum')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${boardType === 'momentum' ? 'bg-white text-sunny-orange shadow-sm' : 'text-gray-400'}`}
              >
                逆袭斜率
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {leaderboard.length > 0 ? leaderboard.map((user) => (
              <div key={user.rank} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    user.rank === 1 ? 'bg-yellow-400 text-white' : 
                    user.rank === 2 ? 'bg-gray-300 text-white' : 
                    user.rank === 3 ? 'bg-orange-300 text-white' : 'text-gray-400'
                  }`}>
                    {user.rank}
                  </div>
                  <div className="text-xl group-hover:scale-125 transition-transform">{user.monster}</div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 group-hover:text-sunny-orange transition-colors">{user.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">{user.is_momentum ? '7日增长' : '累计经验'}</div>
                  </div>
                </div>
                <div className="text-xs font-black text-gray-400">
                  {user.exp} <span className="text-[8px] opacity-50">EXP</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-400 text-xs">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroHall;