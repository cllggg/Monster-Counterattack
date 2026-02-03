import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Settings, ArrowLeft, Shield, Bell, Activity } from 'lucide-react';

interface ParentPortalProps {
  onBack: () => void;
}

const ParentPortal: React.FC<ParentPortalProps> = ({ onBack }) => {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />
      
      {/* Header */}
      <header className="p-6 flex items-center z-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:scale-105 transition-transform text-slate-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="ml-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">家长传送门</h1>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">THE PORTAL</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 z-10 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Activity size={24} />
            </div>
            <span className="font-bold text-slate-700 text-sm">学习周报</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Settings size={24} />
            </div>
            <span className="font-bold text-slate-700 text-sm">偏好设置</span>
          </motion.div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Shield size={18} className="mr-2 text-slate-500" />
              安全管控
            </h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">已开启</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">当前护眼模式已开启，每日使用时长限制为 45 分钟。</p>
          <button className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">调整限制</button>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Bell size={18} className="mr-2 text-slate-500" />
              最新消息
            </h3>
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-4 border-b border-slate-50">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">本周听写任务已完成</p>
                <p className="text-xs text-slate-400 mt-1">2小时前</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">作文《难忘的一天》获得好评</p>
                <p className="text-xs text-slate-400 mt-1">昨天</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
