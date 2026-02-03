import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Map, Puzzle, ArrowLeft, Brain, Search } from 'lucide-react';

interface MistForestProps {
  onBack: () => void;
  onNavigate: (feature: string, mode?: string) => void;
}

const MistForest: React.FC<MistForestProps> = ({ onBack, onNavigate }) => {
  const modules = [
    {
      id: 'step-reading',
      title: '阶梯式拆解',
      sub: 'Step-by-Step Breakdown',
      desc: '分层阅读，像爬梯子一样轻松读懂长文章',
      icon: <Map size={32} />,
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-200',
      action: () => onNavigate('reading', 'reading')
    },
    {
      id: 'socratic-guide',
      title: 'AI 苏格拉底导读',
      sub: 'Socratic Guide',
      desc: '通过提问引导思考，深入理解文章内涵',
      icon: <Brain size={32} />,
      color: 'bg-teal-500',
      shadow: 'shadow-teal-200',
      action: () => onNavigate('reading', 'discussing')
    },
    {
      id: 'logic-puzzle',
      title: '逻辑拼图',
      sub: 'Logic Puzzle',
      desc: '重组文章碎片，锻炼逻辑思维能力',
      icon: <Puzzle size={32} />,
      color: 'bg-cyan-500',
      shadow: 'shadow-cyan-200',
      action: () => onNavigate('reading', 'puzzle')
    }
  ];

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-100/50 to-transparent pointer-events-none" />
      <div className="absolute top-10 right-10 opacity-10">
        <BookOpen size={200} className="text-emerald-900" />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center z-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:scale-105 transition-transform text-emerald-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="ml-4">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight">迷雾森林探险</h1>
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">THE READER</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 z-10 overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          {modules.map((mod, idx) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={mod.action}
              className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-lg cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${mod.color} opacity-10 rounded-bl-[100px] transition-transform group-hover:scale-110`} />
              
              <div className="flex items-start space-x-4 relative z-10">
                <div className={`p-4 ${mod.color} rounded-2xl text-white shadow-lg ${mod.shadow} group-hover:scale-105 transition-transform`}>
                  {mod.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-800">{mod.title}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-2">{mod.sub}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{mod.desc}</p>
                </div>
                <div className="self-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-emerald-50 transition-colors">
                    <Search size={20} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Status Card */}
        <div className="mt-6 bg-emerald-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">阅读探险进度</h3>
            <div className="flex items-center space-x-2 text-emerald-300 text-sm mb-4">
              <span>已解锁 3 个章节</span>
              <span>•</span>
              <span>获得 12 枚徽章</span>
            </div>
            <div className="w-full h-2 bg-emerald-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-1/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MistForest;
