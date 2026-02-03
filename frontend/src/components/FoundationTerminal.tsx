import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Search, Scissors, Sword, Mic, Zap } from 'lucide-react';

interface FoundationTerminalProps {
  onBack: () => void;
  onNavigate: (view: 'dictation' | 'typo' | 'surgery' | 'matching' | 'radio') => void;
}

const FoundationTerminal: React.FC<FoundationTerminalProps> = ({ onBack, onNavigate }) => {
  const modules = [
    {
      id: 'f1',
      title: '听觉电台',
      sub: 'Auditory Radio',
      desc: '调频旋钮，收听生字词与每日一句',
      icon: <Mic size={32} />,
      color: 'bg-blue-500',
      shadow: 'shadow-blue-200',
      action: () => onNavigate('radio'),
      extra: { label: '词义挑战', action: () => onNavigate('matching'), icon: <Sword size={14} /> }
    },
    {
      id: 'f_dictation',
      title: '听写机器人',
      sub: 'Dictation Bot',
      desc: '智能语音听写，练就完美拼写功力',
      icon: <Zap size={32} />,
      color: 'bg-sunny-orange',
      shadow: 'shadow-sunny-orange-200',
      action: () => onNavigate('dictation')
    },
    {
      id: 'f2',
      title: '易错字诊所',
      sub: 'Typo Clinic',
      desc: '火眼金睛找茬，消灭错别字',
      icon: <Search size={32} />,
      color: 'bg-orange-500',
      shadow: 'shadow-orange-200',
      action: () => onNavigate('typo')
    },
    {
      id: 'f3',
      title: '病句手术台',
      sub: 'Sentence Surgery',
      desc: '化身外科医生，修复受损语句',
      icon: <Scissors size={32} />,
      color: 'bg-purple-500',
      shadow: 'shadow-purple-200',
      action: () => onNavigate('surgery')
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-sunny-orange" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-sunny-orange uppercase tracking-[0.2em] mb-1">THE FOUNDATION</span>
          <div className="text-sm font-black text-gray-800">能量收集站</div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {modules.map((m) => (
          <motion.div
            key={m.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer"
            onClick={m.action}
          >
            <div className={`absolute top-0 right-0 p-6 opacity-5 ${m.color.replace('bg-', 'text-')} group-hover:opacity-10 transition-opacity`}>
              {m.icon}
            </div>
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${m.color} text-white rounded-2xl flex items-center justify-center shadow-lg ${m.shadow}`}>
                  {m.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">{m.title}</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.sub}</span>
                  <p className="text-xs text-gray-500 font-medium mt-1">{m.desc}</p>
                </div>
              </div>
            </div>

            {m.extra && (
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); m.extra.action(); }}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-black flex items-center space-x-2 transition-colors"
                >
                  {m.extra.icon}
                  <span>{m.extra.label}</span>
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FoundationTerminal;