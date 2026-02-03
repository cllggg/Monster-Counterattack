import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PenTool, Send, Sparkles, Lightbulb, Mic, MicOff, Trophy, MessageCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WritingPilotProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
}

const MonsterReaction = ({ status }: { status: 'idle' | 'writing' | 'evaluated' }) => {
  return (
    <motion.div 
      animate={status === 'writing' ? { 
        rotate: [0, 5, -5, 0],
        y: [0, -5, 0]
      } : status === 'evaluated' ? { 
        scale: [1, 1.2, 1],
        rotate: [0, 360],
        filter: ['drop-shadow(0 0 0px rgba(255,140,66,0))', 'drop-shadow(0 0 10px rgba(255,140,66,0.5))', 'drop-shadow(0 0 0px rgba(255,140,66,0))']
      } : {
        opacity: [0.8, 1, 0.8]
      }}
      transition={status === 'idle' ? { duration: 3, repeat: Infinity } : { duration: 0.5 }}
      className="text-4xl"
    >
      {status === 'evaluated' ? '✨' : status === 'writing' ? '🖋️' : '💡'}
    </motion.div>
  );
};

import InspirationWheel from './InspirationWheel';

const PredictiveVisuals = ({ text }: { text: string }) => {
  const [activeEffects, setActiveEffects] = useState<{id: string, icon: string, color: string}[]>([]);
  const lastText = useRef('');

  useEffect(() => {
    const keywords = [
      { key: /太阳|阳光|晴天|温暖/, icon: '☀️', color: 'rgba(255, 200, 0, 0.1)' },
      { key: /雨|哭|泪|湿|悲伤/, icon: '🌧️', color: 'rgba(0, 100, 255, 0.1)' },
      { key: /星星|闪烁|星空|梦想/, icon: '✨', color: 'rgba(150, 0, 255, 0.1)' },
      { key: /火|热|红|愤怒/, icon: '🔥', color: 'rgba(255, 50, 0, 0.1)' },
      { key: /风|吹|快|自由/, icon: '🍃', color: 'rgba(50, 255, 100, 0.1)' },
      { key: /花|春|美|开心/, icon: '🌸', color: 'rgba(255, 100, 200, 0.1)' },
      { key: /雪|冷|白|孤独/, icon: '❄️', color: 'rgba(200, 230, 255, 0.1)' },
      { key: /龙|怪兽|力量|强大/, icon: '🐲', color: 'rgba(0, 150, 50, 0.1)' },
      { key: /书|学习|知识|智慧/, icon: '📖', color: 'rgba(139, 69, 19, 0.1)' }
    ];

    const currentText = text;
    if (currentText.length > lastText.current.length) {
      // Check last 10 chars for better context
      const snippet = currentText.slice(-10);
      const match = keywords.find(k => k.key.test(snippet));
      
      if (match) {
        const id = Math.random().toString(36).substr(2, 9);
        setActiveEffects(prev => [...prev, { id, icon: match.icon, color: match.color }]);
        setTimeout(() => {
          setActiveEffects(prev => prev.filter(e => e.id !== id));
        }, 3000);
      }
    }
    lastText.current = currentText;
  }, [text]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <AnimatePresence>
        {activeEffects.map((effect) => (
          <React.Fragment key={effect.id}>
            {/* Full screen color flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 transition-colors duration-1000"
              style={{ backgroundColor: effect.color }}
            />
            {/* Floating Emojis */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`${effect.id}-${i}`}
                initial={{ 
                  opacity: 0, 
                  x: Math.random() * 400 - 200, 
                  y: 400, 
                  scale: 0.5 
                }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  y: -200, 
                  x: (Math.random() * 400 - 200) + (i * 20),
                  scale: [0.5, 1.5, 0.5],
                  rotate: Math.random() * 360 
                }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute left-1/2 text-4xl"
              >
                {effect.icon}
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
};

const WritingPilot: React.FC<WritingPilotProps> = ({ onBack, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '哈喽！我是你的作文领航员。不知道写什么？试试点击右下角的“灵感转盘”吧！🖋️' }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'wheel' | 'structure'>('chat');
  
  const handleWheelComplete = (prompt: string) => {
    setInput(`我想写一个故事：${prompt}`);
    setTopic(prompt);
    setActiveTab('chat');
    setMessages(prev => [...prev, { role: 'user', content: `我想写一个故事：${prompt}` }]);
    setIsLoading(true);
    api.chatWriting([...messages, { role: 'user', content: `我想写一个故事：${prompt}` }], prompt).then(data => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        setIsLoading(false);
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [topic, setTopic] = useState('');
  const [evaluation, setEvaluation] = useState<{ score: number; tips: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (messages.length === 1) {
        setTopic(input);
    }

    try {
      const data = await api.chatWriting(messages, topic || input);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Writing Pilot Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '哎呀，我的墨水瓶翻了，请再说一遍你的想法好吗？🖌️' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!draft.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await api.evaluateWriting(draft, topic);
      setEvaluation(data);
      setMessages(prev => [...prev, { role: 'assistant', content: `我已经对你的作文进行了多维评估！得分是 ${data.score}。我还为你准备了一些进阶建议，快来看看吧！✨` }]);
    } catch (error) {
      console.error('Evaluation Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete(20); // Award 20 EXP for finishing a writing session
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl relative overflow-hidden border border-white/50">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <PenTool size={200} className="text-purple-500" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-20 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-all active:scale-90 bg-white/50 shadow-sm border border-purple-50">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-purple-500" />
        </button>
        
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'chat' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
          >
            写作领航
          </button>
          <button 
            onClick={() => setActiveTab('wheel')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'wheel' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
          >
            灵感大转盘
          </button>
        </div>

        <button 
          onClick={handleFinish}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-200 active:scale-95 transition-all"
        >
          完成修炼
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        <PredictiveVisuals text={activeTab === 'chat' ? input : draft} />
        {activeTab === 'wheel' && (
          <div className="h-full flex items-center justify-center">
            <InspirationWheel onComplete={handleWheelComplete} />
          </div>
        )}

        {activeTab === 'structure' && (
           <div className="h-full overflow-y-auto px-2 pb-20">
             <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">结构脚手架</h2>
             <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-600 mb-2 flex items-center"><span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs mr-2">1</span> 开头：凤头</h3>
                    <p className="text-xs text-gray-500 mb-3">好的开头能吸引人。试试“开门见山”或“设置悬念”？</p>
                    <textarea 
                        className="w-full p-3 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none h-24"
                        placeholder="例：那是夏天里最热的一天..."
                        value={draft.split('\n\n')[0] || ''}
                        onChange={(e) => {
                            const parts = draft.split('\n\n');
                            parts[0] = e.target.value;
                            setDraft(parts.join('\n\n'));
                        }}
                    />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                    <h3 className="font-bold text-yellow-600 mb-2 flex items-center"><span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs mr-2">2</span> 中间：猪肚</h3>
                    <p className="text-xs text-gray-500 mb-3">内容要丰富！记得用上“五感”（看到的、听到的...）。</p>
                    <textarea 
                        className="w-full p-3 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-yellow-200 outline-none resize-none h-32"
                        placeholder="发生了什么？细节是关键..."
                        value={draft.split('\n\n')[1] || ''}
                        onChange={(e) => {
                            const parts = draft.split('\n\n');
                            if (parts.length < 2) parts.push('');
                            parts[1] = e.target.value;
                            setDraft(parts.join('\n\n'));
                        }}
                    />
                </div>

                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <h3 className="font-bold text-green-600 mb-2 flex items-center"><span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs mr-2">3</span> 结尾：豹尾</h3>
                    <p className="text-xs text-gray-500 mb-3">有力地收尾，总结你的感受。</p>
                    <textarea 
                        className="w-full p-3 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-green-200 outline-none resize-none h-24"
                        placeholder="这件事让我明白了..."
                        value={draft.split('\n\n')[2] || ''}
                        onChange={(e) => {
                            const parts = draft.split('\n\n');
                            while (parts.length < 3) parts.push('');
                            parts[2] = e.target.value;
                            setDraft(parts.join('\n\n'));
                        }}
                    />
                </div>

                <button 
                    onClick={async () => {
                        setIsLoading(true);
                        try {
                           const res = await api.polishWriting(draft, topic || "未命名");
                           setEvaluation({ score: 85, tips: res.suggestions.map((s: any) => s.suggestion) }); // Adapt response
                           setActiveTab('chat');
                           setMessages(prev => [...prev, { role: 'assistant', content: `我已经帮你润色啦！\n\n${res.comment}\n\n✨ 高光时刻：${res.highlights.join(', ')}` }]);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2"
                >
                    <Sparkles size={18} />
                    <span>合成作文并润色</span>
                </button>
             </div>
           </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
             <div className="flex-1 space-y-4 mb-4" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2 mt-2">
                        <Sparkles size={14} className="text-purple-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-purple-500 text-white rounded-br-none shadow-lg shadow-purple-200' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                  <div className="flex justify-start">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                        <Sparkles size={14} className="text-purple-500" />
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none">
                          <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                          </div>
                      </div>
                  </div>
              )}
            </div>
            <div className="flex space-x-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="告诉领航员你的想法..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
              <button 
                onClick={handleSend}
                className="p-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingPilot;
