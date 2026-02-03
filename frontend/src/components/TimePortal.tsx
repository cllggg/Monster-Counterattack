import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserCircle, Plus, Users, Settings, Crown, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface TimePortalProps {
  onBack: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  lastActive: string;
}

const MOCK_PROFILES: UserProfile[] = [];

const TimePortal: React.FC<TimePortalProps> = ({ onBack }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
      if (data.length > 0 && !activeProfileId) {
        setActiveProfileId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    // In a real app, we would persist this or update global context
    console.log(`Switched to user ${id}`);
    alert('身份切换成功！');
  };

  const handleAddProfile = async () => {
    const newName = prompt("请输入新学员的名字：");
    if (newName) {
      try {
        await api.createProfile(newName);
        await loadProfiles();
      } catch (error) {
        console.error('Failed to create profile:', error);
      }
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (confirm('确定要删除这个档案吗？数据将无法恢复。')) {
      try {
        await api.deleteProfile(id);
        await loadProfiles();
      } catch (error) {
        console.error('Failed to delete profile:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden max-h-[90vh]">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-indigo-500" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">ACCOUNT & IDENTITY</span>
          <div className="text-sm font-black text-gray-800">时空传送门</div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-3 rounded-2xl transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-white text-gray-400'}`}
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 mb-2">选择你的身份</h2>
          <p className="text-gray-500 text-xs">每个身份拥有独立的进化记录</p>
        </div>

        <div className="grid grid-cols-1 gap-4 px-2">
          <AnimatePresence>
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => !isEditing && handleSwitchProfile(profile.id)}
                className={`relative p-4 rounded-[2rem] border-2 transition-all cursor-pointer group ${
                  activeProfileId === profile.id 
                  ? 'bg-white border-indigo-400 shadow-xl shadow-indigo-100' 
                  : 'bg-white/60 border-transparent hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform ${
                    activeProfileId === profile.id ? 'bg-indigo-500 scale-105' : 'bg-gray-100 group-hover:scale-105'
                  }`}>
                    {profile.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-black text-lg ${activeProfileId === profile.id ? 'text-gray-800' : 'text-gray-600'}`}>
                        {profile.name}
                      </h3>
                      {activeProfileId === profile.id && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">当前</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-400 font-medium">Lv.{profile.level}</span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-xs text-gray-400">{profile.lastActive}活跃</span>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                     activeProfileId === profile.id && <div className="text-indigo-500"><Crown size={24} fill="currentColor" className="opacity-20" /></div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add New Profile Button */}
          <motion.button
            layout
            onClick={handleAddProfile}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold flex items-center justify-center space-x-2 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
          >
            <Plus size={20} />
            <span>新建学生档案</span>
          </motion.button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center z-10">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Monster Intelligence Training System
        </p>
      </div>
    </div>
  );
};

export default TimePortal;
