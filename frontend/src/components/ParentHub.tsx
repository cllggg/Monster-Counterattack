import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { ArrowLeft, BarChart2, Calendar, AlertCircle } from 'lucide-react';

interface ParentHubProps {
  onBack: () => void;
}

const ParentHub: React.FC<ParentHubProps> = ({ onBack }) => {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api.getWeeklyReport();
        setReport(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchReport();
  }, []);

  if (!report) return <div className="flex items-center justify-center h-full">生成报告中...</div>;

  const maxVal = Math.max(...report.daily_stats.map((d: any) => d.value));

  return (
    <div className="flex flex-col h-full bg-orange-50 rounded-[3rem] p-6 shadow-2xl border border-orange-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-500" />
        </button>
        <span className="text-sm font-black text-orange-400 tracking-widest uppercase">Parent Hub</span>
        <div className="w-12" />
      </div>

      <div className="text-2xl font-black text-gray-800 mb-2">本周成长周报</div>
      <div className="text-sm text-gray-500 mb-8">学生: {report.student_name}</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="text-xs text-gray-400 mb-1">总学习时长</div>
            <div className="text-2xl font-black text-gray-800">{report.total_study_time} <span className="text-sm font-normal text-gray-400">min</span></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="text-xs text-gray-400 mb-1">获得能量</div>
            <div className="text-2xl font-black text-orange-500">{report.total_exp_gained} <span className="text-sm font-normal text-gray-400">EXP</span></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={16} className="text-orange-500"/>
            <span className="font-bold text-gray-700">能量趋势</span>
        </div>
        <div className="flex items-end justify-between h-40 gap-2">
            {report.daily_stats.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.value / maxVal) * 100}%` }}
                        className="w-full bg-orange-200 rounded-t-lg relative group"
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {d.value} EXP
                        </div>
                    </motion.div>
                    <span className="text-[10px] text-gray-400 font-bold">{d.date}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Weak Points */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-red-400"/>
            <span className="font-bold text-gray-700">本周攻坚点</span>
        </div>
        <div className="flex flex-wrap gap-2">
            {report.weak_points.map((p: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-full">
                    {p}
                </span>
            ))}
        </div>
      </div>

      {/* Suggestion */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-6 rounded-3xl shadow-lg text-white">
        <div className="font-bold mb-2 opacity-80 uppercase text-xs tracking-widest">AI Coach Suggestion</div>
        <div className="leading-relaxed text-sm font-medium">
            "{report.suggestions}"
        </div>
      </div>

    </div>
  );
};

export default ParentHub;
