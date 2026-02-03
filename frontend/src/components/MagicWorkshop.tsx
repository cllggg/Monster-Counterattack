import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Lightbulb, Edit3, ArrowLeft, Wand2, Sparkles } from 'lucide-react';

interface MagicWorkshopProps {
  onBack: () => void;
  onNavigate: (feature: string) => void;
}

const MagicWorkshop: React.FC<MagicWorkshopProps> = ({ onBack, onNavigate }) => {
  const modules = [
    {
      id: 'inspiration',
      title: '灵感大转盘',
      sub: 'Inspiration Wheel',
      desc: '转动魔法轮盘，获取源源不断的写作灵感',
      icon: <Lightbulb size={32} />,
      color: 'bg-purple-500',
      shadow: 'shadow-purple-200',
      action: () => onNavigate('writing')
    },
    {
      id: 'structure',
      title: '结构脚手架',
      sub: 'Structure Scaffolding',
      desc: '搭建文章骨架，让写作条理清晰',
      icon: <Edit3 size={32} />,
      color: 'bg-indigo-500',
      shadow: 'shadow-indigo-200',
      action: () => onNavigate('writing')
    },
    {
      id: 'polisher',
      title: 'AI 润色师',
      sub: 'The Polisher',
      desc: '魔法润色，让你的文字闪闪发光',
      icon: <Wand2 size={32} />,
      color: 'bg-violet-500',
      shadow: 'shadow-violet-200',
      action: () => onNavigate('writing')
    }
  ];

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-100/50 to-transparent pointer-events-none" />
      <div className="absolute top-10 right-10 opacity-10">
        <PenTool size={200} className="text-purple-900" />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center z-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:scale-105 transition-transform text-purple-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="ml-4">
          <h1 className="text-2xl font-black text-purple-900 tracking-tight">魔法卷轴工坊</h1>
          <p className="text-xs text-purple-600 font-bold uppercase tracking-widest">THE WRITER</p>
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
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-2">{mod.sub}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{mod.desc}</p>
                </div>
                <div className="self-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-purple-50 transition-colors">
                    <Sparkles size={20} className="text-purple-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Status Card */}
        <div className="mt-6 bg-purple-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PenTool size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">写作工坊动态</h3>
            <div className="flex items-center space-x-2 text-purple-300 text-sm mb-4">
              <span>已创作 5 篇卷轴</span>
              <span>•</span>
              <span>获得 3 个魔法印章</span>
            </div>
            <div className="w-full h-2 bg-purple-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicWorkshop;
