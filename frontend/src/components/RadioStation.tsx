import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { api } from '../services/api';
import { ArrowLeft, Volume2, Radio } from 'lucide-react';

interface RadioStationProps {
  onBack: () => void;
}

const RadioStation: React.FC<RadioStationProps> = ({ onBack }) => {
  const [frequency, setFrequency] = useState(87.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Knob rotation logic
  const angle = useMotionValue(0);
  const rotation = useTransform(angle, (a) => a);
  
  // Stations map: frequency -> text content
  const stations: Record<number, string> = {
    90.5: "欢迎来到怪兽电台，今天是生字词听写专场。请听第一个词：辩论。",
    95.0: "下面播报一则通知：所有四年级的小怪兽请注意，易错字诊所由于大风暂停营业。",
    101.3: "现在是每日一句：宝剑锋从磨砺出，梅花香自苦寒来。"
  };

  useEffect(() => {
    // Convert rotation to frequency (simplified)
    const unsubscribe = angle.on("change", (latest) => {
      // Normalize angle to frequency 87.5 - 108.0
      // 360 degrees = 20MHz range approx
      const normalized = (latest % 360 + 360) % 360; 
      const freq = 87.5 + (normalized / 360) * 20.5;
      setFrequency(Number(freq.toFixed(1)));
    });
    return unsubscribe;
  }, []);

  // Check for tuning
  useEffect(() => {
    const tuned = Object.keys(stations).find(f => Math.abs(Number(f) - frequency) < 0.3);
    if (tuned && tuned !== currentStation) {
      setCurrentStation(tuned);
      playStation(stations[Number(tuned)]);
    } else if (!tuned && currentStation) {
      setCurrentStation(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [frequency]);

  const playStation = async (text: string) => {
    try {
      const url = await api.getTTS(text);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Failed to play TTS", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-[3rem] p-6 shadow-inner relative overflow-hidden">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors">
          <ArrowLeft size={24} className="text-gray-500" />
        </button>
        <span className="text-sm font-black text-gray-400 tracking-widest uppercase">F1 听觉电台</span>
        <div className="w-12" />
      </div>

      {/* Frequency Display */}
      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <div className="bg-gray-800 text-green-400 font-mono text-6xl p-6 rounded-xl shadow-lg border-4 border-gray-700 mb-8 relative">
          {frequency.toFixed(1)} <span className="text-xl">MHz</span>
          {/* Signal Indicator */}
          <div className="absolute top-2 right-2 flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-1 h-${i*2} ${currentStation ? 'bg-green-500' : 'bg-gray-600'} rounded-sm transition-colors`} style={{height: i*4}} />
            ))}
          </div>
        </div>

        <div className="text-center mb-12 h-16">
          {currentStation ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-gray-600 font-bold">
              正在播放: {stations[Number(currentStation)].slice(0, 15)}...
            </motion.div>
          ) : (
            <div className="text-gray-400">旋转旋钮搜索信号...</div>
          )}
        </div>

        {/* The Knob */}
        <div className="relative w-64 h-64">
           {/* Base */}
           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-xl" />
           {/* Rotatable Part */}
           <motion.div 
             className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing"
             style={{ rotate: angle }}
             drag
             dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
             dragElastic={0}
             dragMomentum={false}
             onDrag={(event, info) => {
                // Simple drag to rotate mapping
                angle.set(angle.get() + info.delta.x + info.delta.y);
             }}
           >
             <div className="w-4 h-4 rounded-full bg-gray-400 absolute top-4" />
             <div className="w-32 h-32 rounded-full border-2 border-gray-300/50" />
             <Radio size={48} className="text-gray-400/50" />
           </motion.div>
        </div>
        
        <div className="mt-8 text-xs text-gray-400">左右拖动旋钮调节频率</div>
      </div>
    </div>
  );
};

export default RadioStation;
