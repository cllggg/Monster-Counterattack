import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';

interface HandwritingPadProps {
  onClear: () => void;
  onConfirm: (svgPath: string) => void;
  status?: 'idle' | 'correct' | 'wrong' | 'recognizing';
}

const HandwritingPad: React.FC<HandwritingPadProps> = ({ onClear, onConfirm, status = 'idle' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4A4A4A'; // 更加沉稳的深灰色，与暖阳橙形成对比
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    
    setCurrentPath(`M ${x} ${y}`);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPaths(prev => [...prev, currentPath]);
    setCurrentPath('');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPaths([]);
    onClear();
  };

  const handleConfirm = () => {
    if (paths.length === 0) return;
    onConfirm(paths.join(' '));
    // 点击确认后立即清空画布
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPaths([]);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <motion.div 
        animate={status === 'wrong' ? { 
          x: [-8, 8, -8, 8, 0],
          backgroundColor: ['#ffffff', '#fff7ed', '#ffffff'] 
        } : status === 'correct' ? {
          scale: [1, 1.02, 1],
          backgroundColor: ['#ffffff', '#fff7ed', '#ffffff']
        } : {}}
        transition={{ duration: 0.4 }}
        className={`relative w-full aspect-[4/3] bg-white/50 backdrop-blur-sm rounded-2xl shadow-inner border-2 transition-colors duration-300 overflow-hidden touch-none ${
          status === 'correct' ? 'border-sunny-orange' :
          status === 'wrong' ? 'border-sunny-orange-200' :
          status === 'recognizing' ? 'border-sunny-orange-300' :
          'border-dashed border-gray-200'
        }`}
      >
        {/* 田字格背景 */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <div className="absolute top-1/2 w-full h-px bg-sunny-orange"></div>
          <div className="absolute left-1/2 h-full w-px bg-sunny-orange"></div>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-sunny-orange"></div>
        </div>

        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-full cursor-crosshair relative z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </motion.div>

      <div className="flex justify-between w-full mt-4 space-x-3">
        <button
          onClick={clearCanvas}
          className="flex-1 py-3 bg-gray-100/80 backdrop-blur-sm text-gray-500 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all text-xs font-bold hover:bg-gray-200"
        >
          <Trash2 size={16} />
          <span>重写</span>
        </button>
        <button
          onClick={handleConfirm}
          disabled={paths.length === 0}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all text-xs font-black ${
            paths.length > 0 ? 'bg-sunny-orange text-white shadow-lg shadow-sunny-orange/20 hover:bg-sunny-orange-600' : 'bg-gray-100/50 text-gray-300'
          }`}
        >
          <Check size={16} />
          <span>确认</span>
        </button>
      </div>
    </div>
  );
};

export default HandwritingPad;
