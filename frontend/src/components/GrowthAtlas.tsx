import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Activity, Calendar, History, TrendingUp, Brain, Star, Award, Zap } from 'lucide-react';
import { api } from '../services/api';

interface GrowthData {
  radar_data: Array<{ label: string; value: number; max_value: number }>;
  heatmap_data: Array<{ date: string; count: number }>;
  timeline: Array<{ date: string; title: string; description: string; type: string }>;
  potential_forecast: string;
}

interface GrowthAtlasProps {
  onBack: () => void;
}

const RadarChart = ({ data }: { data: GrowthData['radar_data'] }) => {
  const size = 500; // 进一步增加 viewBox 尺寸，提供更多边距
  const center = size / 2;
  const radius = 110; // 适中半径
  const angleStep = (Math.PI * 2) / data.length;

  const getPoints = (isBg = false) => {
    return data.map((d, i) => {
      const val = isBg ? d.max_value : d.value;
      const r = (val / d.max_value) * radius;
      const angle = i * angleStep - Math.PI / 2;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
  };

  const points = getPoints();
  const bgPoints = getPoints(true);
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  return (
    <div className="relative w-full flex justify-center py-2">
      <svg 
        width="100%" 
        height="auto" 
        viewBox={`0 0 ${size} ${size}`} 
        className="max-w-[380px] drop-shadow-xl overflow-visible"
      >
        {/* Background Grids */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <path
            key={scale}
            d={`M ${bgPoints.map(p => {
              const dx = p.x - center;
              const dy = p.y - center;
              return `${center + dx * scale},${center + dy * scale}`;
            }).join(' L ')} Z`}
            fill="none"
            stroke="rgba(255, 140, 66, 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {bgPoints.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255, 140, 66, 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Data Area */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={pathData}
          fill="rgba(255, 140, 66, 0.25)"
          stroke="#FF8C42"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Labels */}
        {bgPoints.map((p, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 45; // 增加标签间距，配合更大的 viewBox
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          
          let textAnchor = "middle";
          const cos = Math.cos(angle);
          if (cos > 0.1) textAnchor = "start";
          else if (cos < -0.1) textAnchor = "end";

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[14px] font-black fill-gray-700 uppercase tracking-tighter"
              >
                {data[i].label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Heatmap = ({ data }: { data: GrowthData['heatmap_data'] }) => {
  // Simple representation for now: a row of squares for the last 14 days
  const today = new Date();
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="flex items-center space-x-1 justify-center py-4">
      {last14Days.map((date) => {
        const record = data.find(d => d.date === date);
        const count = record ? record.count : 0;
        const intensity = Math.min(count * 20, 100);
        return (
          <div key={date} className="group relative">
            <div 
              className="w-4 h-4 rounded-sm transition-all"
              style={{ 
                backgroundColor: count > 0 ? `rgba(255, 140, 66, ${0.2 + (intensity/100) * 0.8})` : '#f3f4f6',
                border: count > 0 ? '1px solid rgba(255, 140, 66, 0.3)' : '1px solid #e5e7eb'
              }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {date}: {count} 能量
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GrowthAtlas: React.FC<GrowthAtlasProps> = ({ onBack }) => {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getGrowthData();
        setData(res);
      } catch (err) {
        console.error('Failed to fetch growth data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-sunny-orange/20 border-t-sunny-orange rounded-full animate-spin" />
        <p className="text-sm font-black text-sunny-orange animate-pulse">正在同步进化轨迹...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[3rem] p-6 shadow-2xl border border-white relative overflow-hidden max-h-[92vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm bg-white/50">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-sunny-orange" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-sunny-orange uppercase tracking-[0.2em] mb-1">EVOLUTION DATA</span>
          <div className="text-sm font-black text-gray-800">成长图谱</div>
        </div>
        <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center shadow-sm">
            <Activity size={20} className="text-sunny-orange" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-12">
        {/* Radar Section */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={16} className="text-sunny-orange" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">能力五维图</h3>
          </div>
          {data && <RadarChart data={data.radar_data} />}
        </section>

        {/* Heatmap Section */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-sunny-orange" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">能量采集热力图</h3>
            </div>
            <span className="text-[9px] font-bold text-gray-400">最近 14 天</span>
          </div>
          {data && <Heatmap data={data.heatmap_data} />}
        </section>

        {/* Potential Forecast Section */}
        <section className="bg-gradient-to-br from-sunny-orange to-orange-600 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Brain size={120} className="text-white" />
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Sparkles size={18} className="text-white animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">AI 潜力预测报告</h3>
            </div>
            <p className="text-sm text-white/90 leading-relaxed font-medium italic relative z-10">
                "{data?.potential_forecast}"
            </p>
            <div className="mt-4 flex items-center space-x-2 text-[10px] font-black text-white/70 uppercase tracking-wider bg-white/10 w-fit px-3 py-1 rounded-full">
                <TrendingUp size={12} />
                <span>DeepSeek 分析驱动</span>
            </div>
        </section>

        {/* Timeline Section */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <History size={16} className="text-sunny-orange" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">进化时间轴</h3>
          </div>
          <div className="space-y-6 relative ml-2">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
            
            {data?.timeline.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-12"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-[0.625rem] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${
                    item.type === 'level_up' ? 'bg-sunny-orange' : 
                    item.type === 'achievement' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:border-sunny-orange-100 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.date}</span>
                        {item.type === 'level_up' ? <TrendingUp size={14} className="text-sunny-orange" /> : <Award size={14} className="text-amber-400" />}
                    </div>
                    <h4 className="text-sm font-black text-gray-800 group-hover:text-sunny-orange transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GrowthAtlas;
