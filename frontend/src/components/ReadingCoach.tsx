import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, MessageCircle, BookOpen, Eye, Mic, MicOff, Trophy, Puzzle, CheckCircle2, XCircle, Map, Lock, RotateCcw, Unlock, Brain } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReadingCoachProps {
  onBack: () => void;
  onComplete: (exp: number) => void;
  initialMode?: 'reading' | 'discussing' | 'puzzle';
}

const MonsterReaction = ({ status }: { status: 'idle' | 'wrong' | 'correct' }) => {
  return (
    <motion.div 
      animate={status === 'correct' ? { 
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
      } : status === 'wrong' ? { 
        x: [0, -5, 5, -5, 5, 0],
        opacity: [1, 0.6, 1]
      } : {
        y: [0, -3, 0]
      }}
      transition={status === 'idle' ? { duration: 3, repeat: Infinity } : { duration: 0.4 }}
      className="text-3xl"
    >
      {status === 'correct' ? '👁️' : status === 'wrong' ? '🌑' : '👁️'}
    </motion.div>
  );
};

interface PuzzleStep {
  id: string;
  content: string;
}

const MOCK_PUZZLE: PuzzleStep[] = [
  { id: '1', content: '小马驮着麦子去磨坊，被小河挡住了去路。' },
  { id: '2', content: '老牛说水很浅，松鼠说水很深。' },
  { id: '3', content: '小马回家问妈妈，妈妈让他自己试一试。' },
  { id: '4', content: '小马下了河，发现河水既不像老牛说的那么浅，也不像松鼠说的那么深。' }
];

const ReadingCoach: React.FC<ReadingCoachProps> = ({ onBack, onComplete, initialMode = 'reading' }) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'discussing' | 'puzzle'>(initialMode);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是你的 AI 阅读教练。今天我们来读一篇关于“勇气”的小文章吧！文章被迷雾笼罩了，你需要完成任务才能解锁哦！🌫️' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingProcess, setThinkingProcess] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Clue Cards State
  const [clues, setClues] = useState<{ id: string; type: 'time' | 'person' | 'plot'; text: string; description?: string }[]>([]);
  const [collectedClues, setCollectedClues] = useState<string[]>([]);
  const [showClueGallery, setShowClueGallery] = useState(false);
  const [flyingClue, setFlyingClue] = useState<{ x: number; y: number; text: string; type: string } | null>(null);

  const handleCollectClue = (text: string, type: 'time' | 'person' | 'plot', e?: React.MouseEvent) => {
    if (!collectedClues.includes(text)) {
      if (e) {
        setFlyingClue({
          x: e.clientX,
          y: e.clientY,
          text,
          type
        });
        setTimeout(() => setFlyingClue(null), 1000);
      }
      
      setCollectedClues(prev => [...prev, text]);
      const descriptions: Record<string, string> = {
        '老牛': '经验丰富的长辈，认为水很浅。',
        '松鼠': '小巧谨慎的邻居，认为水很深。',
        '磨坊': '目的地，象征着任务的目标。',
        '突然': '事情发生转折的关键时刻。',
        '大钟': '范氏家里的宝物，青铜铸成。',
        '小偷': '想偷走大钟的人，聪明反被聪明误。',
        '铁锤': '用来砸碎大钟的工具。',
        '捂住耳朵': '自欺欺人的典型动作。'
      };
      setClues(prev => [...prev, { 
        id: crypto.randomUUID(), 
        type, 
        text,
        description: descriptions[text] || '在这篇文章中发现的关键线索。'
      }]);
    }
  };

  // Puzzle State
  const [puzzleSteps, setPuzzleSteps] = useState<PuzzleStep[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [puzzleStatus, setPuzzleStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const handlePuzzleSelect = (id: string) => {
    if (selectedOrder.includes(id)) {
      setSelectedOrder(prev => prev.filter(item => item !== id));
    } else {
      setSelectedOrder(prev => [...prev, id]);
    }
    setPuzzleStatus('idle');
  };

  const checkPuzzle = () => {
    const targetSegments = articleData?.puzzle_segments || MOCK_PUZZLE;
    const correctOrder = targetSegments.map(p => p.id).join(',');
    const isCorrect = selectedOrder.join(',') === correctOrder;

    if (isCorrect) {
      setPuzzleStatus('correct');
      // Grant EXP logic
      onComplete(30);
    } else {
      setPuzzleStatus('wrong');
    }
  };

  const resetPuzzle = () => {
    setSelectedOrder([]);
    setPuzzleStatus('idle');
  };

  // Article Data
  interface Article {
    id: string;
    title: string;
    content: { // Note: DB returns 'content' which is the array of paragraphs
      id: number;
      content: string;
      task: string;
      answer: string;
    }[];
    puzzle_segments?: PuzzleStep[];
  }
  
  const [articleData, setArticleData] = useState<Article | null>(null);
  const [unlockedIndex, setUnlockedIndex] = useState(0);
  const [taskAnswer, setTaskAnswer] = useState('');
  const [taskStatus, setTaskStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleResetProgress = async () => {
    if (!articleData) return;
    try {
      await api.resetReadingProgress(articleData.id);
      setUnlockedIndex(0);
      setTaskAnswer('');
      setTaskStatus('idle');
      setShowCompletionModal(false);
      setMessages([
        { role: 'assistant', content: `进度已重置。让我们重新开始阅读《${articleData.title}》吧！🌫️` }
      ]);
    } catch (err) {
      console.error("Failed to reset progress", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const articles = await api.getArticles();
        if (articles.length > 0) {
          const firstArticle = articles[0];
          // Backend returns 'content' field as the JSON array of paragraphs.
          // We map it to our structure if needed, or just use it.
          // The seed data has "content": [...] which is the array.
          setArticleData(firstArticle);
          
          const progress = await api.getReadingProgress(firstArticle.id);
          setUnlockedIndex(progress.current_paragraph_index);

          // Load Puzzle if available, otherwise use default
          if (firstArticle.puzzle_segments) {
              setPuzzleSteps([...firstArticle.puzzle_segments].sort(() => 0.5 - Math.random()));
          } else {
              setPuzzleSteps([...MOCK_PUZZLE].sort(() => 0.5 - Math.random()));
          }
          
          // Reset intro message with actual title
           setMessages([
            { role: 'assistant', content: `你好！我是你的 AI 阅读教练。今天我们来读《${firstArticle.title}》吧！文章被迷雾笼罩了，你需要完成任务才能解锁哦！🌫️` }
          ]);
        }
      } catch (err) {
        console.error("Failed to load reading data", err);
      }
    };
    loadData();
  }, []);

  const handleTaskSubmit = async () => {
    if (!taskAnswer.trim() || !articleData) return;
    
    // In DB, 'content' is the array of paragraphs
    const paragraphs = articleData.content; 
    const currentTask = paragraphs[unlockedIndex];
    const keywords = currentTask.answer.split('|');
    const isCorrect = keywords.some(keyword => 
      taskAnswer.trim().toLowerCase().includes(keyword.toLowerCase())
    );

    if (isCorrect) {
      setTaskStatus('correct');
      
      try {
        await api.unlockReadingProgress(articleData.id);
      } catch (e) {
        console.error("Failed to save progress", e);
      }

      setTimeout(() => {
        if (unlockedIndex < paragraphs.length - 1) {
          setUnlockedIndex(prev => prev + 1);
          setTaskAnswer('');
          setTaskStatus('idle');
        } else {
          setShowCompletionModal(true);
        }
      }, 1000);
    } else {
      setTaskStatus('wrong');
      setMessages(prev => [...prev, { role: 'assistant', content: '🤔 好像不太对哦，再读一遍这一段，找找关键词？' }]);
    }
  };

  const handleGuide = () => {
    // Socratic Guide Logic
    setMessages(prev => [...prev, { role: 'assistant', content: '💡 提示：仔细看看第一句话，或者找找形容词？' }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !articleData) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 模拟思维轨迹
    const processes = ['正在检索《名师导学案》...', '正在分析段落情感...', '正在生成启发式提问...'];
    setThinkingProcess([]);
    for (let i = 0; i < processes.length; i++) {
        setThinkingProcess(prev => [...prev, processes[i]]);
        await new Promise(r => setTimeout(r, 600));
    }

    try {
      const clueContext = clues.length > 0 
        ? `\n用户已收集的线索：${clues.map(c => `${c.text}(${c.type})`).join(', ')}` 
        : '';
      const data = await api.chatWithReader([...messages, userMsg], `文章标题：${articleData.title}\n文章内容：${JSON.stringify(articleData.content)}${clueContext}`);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '哎呀，我的能量核心有点不稳定，稍等我修一下... 🛠️' }]);
    } finally {
      setIsLoading(false);
      setThinkingProcess([]);
    }
  };

  if (!articleData) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin text-4xl">🌀</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-colors group shadow-sm">
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-emerald-500" />
        </button>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('reading')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'reading' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
          >
            迷雾阅读
          </button>
          <button 
            onClick={() => setActiveTab('discussing')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'discussing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
          >
            苏格拉底导读
          </button>
          <button 
            onClick={() => setActiveTab('puzzle')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'puzzle' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
          >
            逻辑拼图
          </button>
        </div>
        <button 
          onClick={handleResetProgress}
          className="p-3 hover:bg-red-50 rounded-2xl transition-colors group shadow-sm ml-2"
          title="重置进度"
        >
          <RotateCcw size={20} className="text-gray-400 group-hover:text-red-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {/* Clue Collection Panel */}
        {collectedClues.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 relative group">
            <div className="w-full text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center justify-between">
               <div className="flex items-center"><Map size={10} className="mr-1" /> 已收集的线索</div>
               <button 
                onClick={() => setShowClueGallery(true)}
                className="text-emerald-500 hover:text-emerald-700 transition-colors flex items-center space-x-1"
               >
                 <Sparkles size={10} />
                 <span>查看图鉴</span>
               </button>
            </div>
            {clues.slice(0, 5).map(clue => (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={clue.id}
                className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center space-x-1 ${
                  clue.type === 'person' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                  clue.type === 'time' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                  'bg-purple-50 border-purple-100 text-purple-600'
                }`}
              >
                <span>{clue.text}</span>
              </motion.div>
            ))}
            {clues.length > 5 && (
              <div className="text-[10px] text-emerald-400 font-black self-center ml-1">
                +{clues.length - 5}...
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
            <p className="text-[10px] text-gray-400 font-bold italic">点击文中下划线关键词收集线索卡片 ✨</p>
          </div>
        )}

        {activeTab === 'reading' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-center text-gray-800 mb-6">{articleData.title}</h2>
            
            {articleData.content.map((para, idx) => (
              <div key={para.id} className="relative flex flex-col items-center">
                {/* Staircase Step Indicator */}
                <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-black z-20 ${
                  idx < unlockedIndex ? 'bg-emerald-500 text-white' :
                  idx === unlockedIndex ? 'bg-emerald-400 text-white animate-pulse' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {idx + 1}
                </div>

                {/* Paragraph Content */}
                <motion.div 
                  initial={{ opacity: 0.5, filter: 'blur(10px)' }}
                  animate={{ 
                    opacity: idx <= unlockedIndex ? 1 : 0.3, 
                    filter: idx <= unlockedIndex ? 'blur(0px)' : 'blur(8px)',
                    x: idx % 2 === 0 ? -10 : 10, // Alternating indentation for staircase feel
                    y: idx <= unlockedIndex ? 0 : 20
                  }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all relative ${
                    idx < unlockedIndex ? 'bg-emerald-50 border-emerald-100' :
                    idx === unlockedIndex ? 'bg-white border-emerald-400 shadow-xl shadow-emerald-100/50' :
                    'bg-gray-100 border-transparent select-none'
                  }`}
                >
                  {/* Step Label */}
                  <div className="absolute -top-3 right-4 px-2 py-1 bg-white border border-gray-100 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                    第 {idx + 1} 阶
                  </div>

                  <p className="text-lg leading-relaxed text-gray-700 font-medium">
                    {(() => {
                      // 简单的关键词提取逻辑
                      const highlightKeywords = [
                        { word: '老牛', type: 'person' as const },
                        { word: '松鼠', type: 'person' as const },
                        { word: '磨坊', type: 'plot' as const },
                        { word: '突然', type: 'time' as const },
                        { word: '大钟', type: 'plot' as const },
                        { word: '小偷', type: 'person' as const },
                        { word: '铁锤', type: 'plot' as const },
                        { word: '捂住耳朵', type: 'plot' as const }
                      ];

                      let content = para.content;
                      const parts = [];
                      let lastIdx = 0;

                      // 排序关键词以防重叠（长词优先）
                      const sortedKeywords = [...highlightKeywords].sort((a, b) => b.word.length - a.word.length);

                      // 找出当前段落中存在的所有关键词位置
                      const matches: { start: number; end: number; word: string; type: 'person' | 'plot' | 'time' }[] = [];
                      sortedKeywords.forEach(hk => {
                        let pos = content.indexOf(hk.word);
                        while (pos !== -1) {
                          // 检查是否与已有的匹配重叠
                          if (!matches.some(m => (pos >= m.start && pos < m.end) || (pos + hk.word.length > m.start && pos + hk.word.length <= m.end))) {
                            matches.push({ start: pos, end: pos + hk.word.length, word: hk.word, type: hk.type });
                          }
                          pos = content.indexOf(hk.word, pos + 1);
                        }
                      });

                      // 按起始位置排序
                      matches.sort((a, b) => a.start - b.start);

                      matches.forEach(m => {
                        parts.push(content.substring(lastIdx, m.start));
                        parts.push(
                          <motion.span
                            key={m.word + idx + m.start}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                            onClick={(e) => handleCollectClue(m.word, m.type, e)}
                            className={`cursor-pointer underline decoration-dotted decoration-emerald-500 font-bold px-1 rounded transition-colors ${collectedClues.includes(m.word) ? 'bg-emerald-100 text-emerald-600' : 'text-gray-800'}`}
                          >
                            {m.word}
                          </motion.span>
                        );
                        lastIdx = m.end;
                      });

                      parts.push(content.substring(lastIdx));
                      return parts.length > 0 ? parts : para.content;
                    })()}
                  </p>
                  
                  {/* Fog Overlay for Locked Paragraphs */}
                  {idx > unlockedIndex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm rounded-2xl z-10">
                      <div className="flex flex-col items-center text-gray-400">
                        <Lock size={32} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">迷雾封锁中</span>
                      </div>
                    </div>
                  )}

                  {/* Task for Current Paragraph */}
                  {idx === unlockedIndex && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 pt-4 border-t border-dashed border-emerald-100"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <Map size={16} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">解锁任务</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 mb-3">{para.task}</p>
                      
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={taskAnswer}
                          onChange={(e) => setTaskAnswer(e.target.value)}
                          placeholder="输入关键词解锁迷雾..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleTaskSubmit()}
                        />
                        <button 
                          onClick={handleTaskSubmit}
                          className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                            taskStatus === 'wrong' ? 'bg-red-500 text-white' : 
                            taskStatus === 'correct' ? 'bg-emerald-500 text-white' : 
                            'bg-gray-900 text-white'
                          }`}
                        >
                          {taskStatus === 'correct' ? <CheckCircle2 size={20} /> : 
                           taskStatus === 'wrong' ? <XCircle size={20} /> : 
                           <Unlock size={20} />}
                        </button>
                      </div>
                      
                      {/* Guide Button */}
                      <button 
                        onClick={handleGuide}
                        className="mt-2 text-[10px] text-gray-400 font-bold flex items-center space-x-1 hover:text-emerald-500 transition-colors"
                      >
                        <Brain size={12} />
                        <span>求助向导 (消耗能量)</span>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Connector Line (Staircase Style) */}
                {idx < articleData.content.length - 1 && (
                  <div className="relative h-12 w-full flex justify-center">
                    <div className={`w-1 h-full transition-colors duration-500 ${
                      idx < unlockedIndex ? 'bg-emerald-200' : 'bg-gray-100'
                    }`} 
                    style={{
                      transform: `translateX(${idx % 2 === 0 ? '20px' : '-20px'}) rotate(${idx % 2 === 0 ? '-15deg' : '15deg'})`
                    }} />
                    {/* Floating Mist Particles on the stairs */}
                    {idx >= unlockedIndex && (
                      <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2], x: [0, 10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-gray-300"
                      >
                        🌫️
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'discussing' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 space-y-4 mb-4">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-emerald-500 text-white rounded-br-none shadow-lg shadow-emerald-200' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Thinking Trace */}
              {isLoading && thinkingProcess.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl rounded-bl-none border border-white/50 shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={14} className="text-emerald-500" />
                      </motion.div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">AI 思考轨迹</span>
                    </div>
                    <div className="space-y-1">
                      {thinkingProcess.map((step, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i}
                          className="text-[10px] text-gray-400 flex items-center"
                        >
                          <div className="w-1 h-1 bg-emerald-500/30 rounded-full mr-2" />
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {isLoading && thinkingProcess.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="flex space-x-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="和苏格拉底聊聊..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none"
              />
              <button onClick={handleSend} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200">
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'puzzle' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-2xl mb-4 border border-emerald-100">
              <div className="flex items-center space-x-2 mb-2">
                <Puzzle size={18} className="text-emerald-600" />
                <span className="font-bold text-emerald-800">逻辑拼图</span>
              </div>
              <p className="text-xs text-emerald-700">请按正确的时间顺序点击下列卡片进行排序。</p>
            </div>

            <div className="space-y-2">
              {puzzleSteps.map((step) => {
                const isSelected = selectedOrder.includes(step.id);
                const orderIndex = selectedOrder.indexOf(step.id);
                
                return (
                  <motion.div
                    key={step.id}
                    layout
                    onClick={() => handlePuzzleSelect(step.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center ${
                      isSelected 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-100 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 font-black text-xs transition-colors ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isSelected ? orderIndex + 1 : ''}
                    </div>
                    <span className="text-sm text-gray-700">{step.content}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={resetPuzzle}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center space-x-2"
              >
                <RotateCcw size={16} />
                <span>重置</span>
              </button>
              <button 
                onClick={checkPuzzle}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                  puzzleStatus === 'correct' ? 'bg-emerald-500 shadow-emerald-200' :
                  puzzleStatus === 'wrong' ? 'bg-red-500 shadow-red-200' :
                  'bg-gray-900 shadow-gray-400'
                }`}
              >
                {puzzleStatus === 'correct' ? '🎉 正确！' : 
                 puzzleStatus === 'wrong' ? '❌ 再试试' : '提交排序'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md"
          >
            <div className="text-center p-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl shadow-emerald-200"
              >
                <Trophy size={48} className="text-white" />
              </motion.div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">迷雾已驱散！</h2>
              <p className="text-gray-500 mb-8">你成功完成了阅读探险，感知力大幅提升！</p>
              <button 
                onClick={() => onComplete(50)}
                className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:scale-105 transition-transform"
              >
                领取奖励
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Flying Clue Animation */}
      <AnimatePresence>
        {flyingClue && (
          <motion.div
            initial={{ x: flyingClue.x, y: flyingClue.y, opacity: 1, scale: 1 }}
            animate={{ 
              x: 100, 
              y: 100, 
              opacity: [1, 1, 0],
              scale: [1, 1.5, 0.5],
              rotate: [0, 45, 90]
            }}
            transition={{ duration: 1, ease: "backIn" }}
            className={`fixed z-[100] px-4 py-2 rounded-full text-sm font-black shadow-2xl pointer-events-none ${
              flyingClue.type === 'person' ? 'bg-blue-500 text-white' :
              flyingClue.type === 'time' ? 'bg-amber-500 text-white' :
              'bg-purple-500 text-white'
            }`}
          >
            {flyingClue.text} ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clue Gallery Modal */}
      <AnimatePresence>
        {showClueGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            onClick={() => setShowClueGallery(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                      <Map size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800">线索图鉴</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">当前文章：{articleData.title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowClueGallery(false)}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                  >
                    <XCircle size={24} className="text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {clues.map((clue) => (
                    <motion.div
                      key={clue.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-5 rounded-[2rem] border-2 flex items-start space-x-4 transition-all ${
                        clue.type === 'person' ? 'bg-blue-50/50 border-blue-100' :
                        clue.type === 'time' ? 'bg-amber-50/50 border-amber-100' :
                        'bg-purple-50/50 border-purple-100'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${
                        clue.type === 'person' ? 'bg-blue-100 text-blue-600' :
                        clue.type === 'time' ? 'bg-amber-100 text-amber-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {clue.type === 'person' ? <CheckCircle2 size={20} /> : 
                         clue.type === 'time' ? <Sparkles size={20} /> : 
                         <Puzzle size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-gray-800">{clue.text}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                            clue.type === 'person' ? 'bg-blue-100 text-blue-600' :
                            clue.type === 'time' ? 'bg-amber-100 text-amber-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {clue.type === 'person' ? '人物' : clue.type === 'time' ? '时间' : '情节'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                          {clue.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {clues.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-gray-400 font-bold">还没有发现任何线索呢</p>
                      <p className="text-xs text-gray-300 mt-2">点击文中带下划线的关键词试试吧！</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px]">
                        {['👤', '⏰', '🎬'][i]}
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">线索收集进度</p>
                    <p className="text-lg font-black text-emerald-500">{clues.length} <span className="text-xs text-gray-300">/ 8</span></p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReadingCoach;
