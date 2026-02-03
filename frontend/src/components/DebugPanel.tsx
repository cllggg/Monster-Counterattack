import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RefreshCcw, Save, Server, Monitor, X } from 'lucide-react';

interface DebugPanelProps {
  localState: {
    exp: number;
    level: number;
    stats: { atk: number; def: number; per: number };
    questStage: string;
  };
  onForceSave: () => Promise<void>;
  onForceLoad: () => Promise<void>;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ localState, onForceSave, onForceLoad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [remoteState, setRemoteState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('-');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const fetchRemote = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfile('current-user');
      setRemoteState(data);
      addLog('Fetched remote data');
    } catch (e) {
      addLog('Failed to fetch remote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onForceSave();
      addLog('Force save executed');
      setLastSyncTime(new Date().toLocaleTimeString());
      await fetchRemote(); // Refresh remote view
    } catch (e) {
      addLog('Force save failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (window.confirm('Are you sure? This will overwrite local progress.')) {
      setIsLoading(true);
      try {
        await onForceLoad();
        addLog('Force load executed');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (e) {
        addLog('Force load failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Auto-fetch remote when opening panel
  useEffect(() => {
    if (isOpen) {
      fetchRemote();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-[9999] hover:bg-gray-700 transition-colors opacity-50 hover:opacity-100"
        title="Open Debug Panel"
      >
        <Server size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-green-400 p-4 rounded-xl shadow-2xl z-[9999] border border-green-500/30 font-mono text-xs">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="font-bold flex items-center gap-2">
          <Monitor size={14} /> System State Monitor
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Local State */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-bold text-gray-400 mb-1 border-b border-gray-700">LOCAL (Client)</div>
          <div>Stage: {localState.questStage}</div>
          <div>EXP: {localState.exp} (Lv.{localState.level})</div>
          <div>Stats: A{localState.stats.atk}/D{localState.stats.def}/P{localState.stats.per}</div>
        </div>

        {/* Remote State */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-bold text-gray-400 mb-1 border-b border-gray-700 flex justify-between">
            <span>REMOTE (DB)</span>
            <button onClick={fetchRemote} disabled={isLoading}><RefreshCcw size={10} /></button>
          </div>
          {remoteState ? (
            <>
              <div className={remoteState.quest_stage !== localState.questStage ? 'text-red-400' : ''}>
                Stage: {remoteState.quest_stage}
              </div>
              <div className={remoteState.exp !== localState.exp ? 'text-red-400' : ''}>
                EXP: {remoteState.exp} (Lv.{remoteState.level})
              </div>
              <div className={
                remoteState.atk !== localState.stats.atk || 
                remoteState.def_val !== localState.stats.def || 
                remoteState.per !== localState.stats.per 
                ? 'text-red-400' : ''
              }>
                Stats: A{remoteState.atk}/D{remoteState.def_val}/P{remoteState.per}
              </div>
            </>
          ) : (
            <div className="text-gray-600 italic">Fetching...</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={handleSave} 
          disabled={isLoading}
          className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={14} /> Force Push
        </button>
        <button 
          onClick={handleLoad}
          disabled={isLoading}
          className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={14} /> Force Pull
        </button>
      </div>

      <div className="bg-black/50 p-2 rounded h-24 overflow-y-auto">
        {logs.length === 0 && <div className="text-gray-600 italic">No logs yet...</div>}
        {logs.map((log, i) => (
          <div key={i} className="whitespace-nowrap">{log}</div>
        ))}
      </div>
      
      <div className="mt-2 text-gray-500 text-[10px] text-right">
        Last Sync: {lastSyncTime}
      </div>
    </div>
  );
};

export default DebugPanel;
