import { useEffect } from 'react';

// --- Types (Mirroring Backend) ---

export interface User {
  id: string;
  username: string;
  role: 'student' | 'parent' | 'teacher';
  created_at?: string;
}

export interface StudentProfile {
  id?: string;
  user_id: string;
  name: string;
  current_monster_id: string;
  exp: number;
  level: number;
  atk: number;
  def_val: number; // Matches backend 'def_val' alias for 'def'
  per: number;
  quest_stage?: string;
  updated_at?: string;
}

export interface DiagnoseRequest {
  student_id: string;
  original_text: string;
  modified_text: string;
  error_type?: string;
}

export interface DiagnoseResponse {
  is_correct: boolean;
  feedback_text: string;
  exp_reward: number;
}

export interface BossBattleStartRequest {
  student_id: string;
  stage_id: string;
}

export interface BossBattleStartResponse {
  battle_id: string;
  initial_state: any;
}

export interface UserBehaviorLog {
  id?: string;
  student_id: string;
  action_type: string;
  duration: number;
  context: Record<string, any>;
  created_at?: string;
}

export interface LearningLog {
  id?: string;
  student_id: string;
  kp_code: string;
  is_correct: boolean;
  exp_gained: number;
  timestamp?: string;
}

// --- Offline Queue Management ---

const OFFLINE_QUEUE_KEY = 'monster_offline_queue';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

const getQueue = (): QueuedRequest[] => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const addToQueue = (req: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
  const queue = getQueue();
  const newReq = { ...req, id: crypto.randomUUID(), timestamp: Date.now() };
  queue.push(newReq);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  console.log('[Offline] Request queued:', newReq);
};

const removeFromQueue = (id: string) => {
  const queue = getQueue().filter(q => q.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

// --- API Client ---

// Mobile-friendly: dynamically determine backend host
const getBaseUrl = () => {
  // If we're on localhost, keep using localhost:8001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  // If we're accessing via IP (mobile), use that same IP but port 8001
  return `http://${window.location.hostname}:8001`;
};

export const BASE_URL = getBaseUrl();

class ApiClient {
  public BASE_URL = BASE_URL; // Expose for external use like sendBeacon

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      if (!navigator.onLine && options.method && options.method !== 'GET') {
        throw new Error('OFFLINE_MODE');
      }

      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
            console.error('API 422 Detail:', errorData.detail);
            console.error('Failed Payload:', options.body);
          }
        } catch (e) {
          // Fallback if not JSON
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.warn(`[API] Connection failed to ${url}. This is expected if the server is down or unreachable from mobile.`);
      }
      
      if (error.message === 'OFFLINE_MODE' || !navigator.onLine || (error.name === 'TypeError' && error.message === 'Failed to fetch')) {
        if (options.method && options.method !== 'GET') {
          // Queue mutation requests for background sync
          addToQueue({
            url: endpoint,
            method: options.method,
            body: options.body ? JSON.parse(options.body as string) : {},
          });
          console.warn('[Offline] Action queued for sync.');
          return {} as T; 
        }
      }
      throw error;
    }
  }

  // --- Foundation Module ---
  
  async diagnoseSentence(studentId: string, original: string, modified: string, type: string): Promise<DiagnoseResponse> {
    return this.request<DiagnoseResponse>('/v1/foundation/sentence/diagnose', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, original_text: original, modified_text: modified, error_type: type }),
    });
  }

  // --- Game Core ---

  async startBossBattle(data: BossBattleStartRequest): Promise<BossBattleStartResponse> {
    return this.request<BossBattleStartResponse>('/v1/game/boss/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(userId: string): Promise<StudentProfile> {
    return this.request<StudentProfile>('/v1/user/stats');
  }

  async syncProfile(profile: any): Promise<void> {
    return this.request<void>('/v1/user/stats', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async getLeaderboard(type: 'exp' | 'momentum' = 'exp') {
    return this.request<{rank: number; name: string; exp: number; monster: string; is_momentum: boolean}[]>(`/v1/social/leaderboard?type=${type}`);
  }

  // --- Logging (PRD 8.0) ---

  async logBehavior(log: UserBehaviorLog): Promise<void> {
    const fullLog = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...log
    };
    // Fire and forget, don't block UI
    this.request('/v1/log/behavior', {
      method: 'POST',
      body: JSON.stringify(fullLog),
    }).catch(err => console.error('Failed to log behavior:', err));
  }

  async logLearning(log: LearningLog): Promise<void> {
    const fullLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.request('/v1/log/learning', {
      method: 'POST',
      body: JSON.stringify(fullLog),
    }).catch(err => console.error('Failed to log learning:', err));
  }

  // --- Account & Identity ---

  async getProfiles() {
    return this.request<any[]>('/v1/auth/profiles');
  }

  async createProfile(name: string) {
    // Construct a default profile object
    const profile: StudentProfile = {
      user_id: 'default_user', // Mock user ID
      name,
      current_monster_id: '1',
      total_exp: 0,
      level: 1,
      atk: 10,
      def_val: 10,
      per: 10
    };
    return this.request<any>('/v1/auth/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async deleteProfile(id: string) {
    return this.request<void>(`/v1/auth/profiles/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Legacy / Feature Specific (Migrated to V1) ---
  
  async chatWithReader(messages: any[], context: string) {
    return this.request<any>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ messages, context }),
    });
  }

  async evaluateWriting(draft: string, topic: string) {
    return this.request<any>('/v1/writing/evaluate', {
      method: 'POST',
      body: JSON.stringify({ draft, topic }),
    });
  }

  async polishWriting(draft: string, topic: string) {
    return this.request<any>('/v1/writing/polish', {
      method: 'POST',
      body: JSON.stringify({ draft, topic }),
    });
  }

  async chatWriting(messages: any[], topic: string) {
    return this.request<any>('/v1/writing/guide', {
      method: 'POST',
      body: JSON.stringify({ messages, topic }),
    });
  }

  async getMistakes() {
    return this.request<any[]>('/v1/log/mistakes');
  }

  async recordMistake(data: { word_id: string; word: string; user_input: string }) {
    // Map old structure to ErrorBank model
    const mistake = {
      id: crypto.randomUUID(),
      student_id: 'default_user',
      kp_code: data.word_id,
      error_tag: '#拼写错误',
      original_question: data.word,
      wrong_answer: data.user_input,
      next_review_date: new Date().toISOString()
    };
    return this.request<void>('/v1/log/mistake', {
      method: 'POST',
      body: JSON.stringify(mistake),
    });
  }

  async clearMistakes() {
    return this.request<void>('/v1/log/mistakes', {
      method: 'DELETE',
    });
  }

  // --- Reading Module ---
  
  async getArticles() {
    return this.request<any[]>('/v1/reading/articles');
  }

  async getArticle(id: string) {
    return this.request<any>(`/v1/reading/articles/${id}`);
  }
  
  async getReadingProgress(articleId: string) {
    return this.request<{ current_paragraph_index: number, is_completed: boolean }>(`/v1/reading/progress/${articleId}`);
  }
  
  async getGrowthData() {
    return this.request<{
      radar_data: Array<{ label: string; value: number; max_value: number }>;
      heatmap_data: Array<{ date: string; count: number }>;
      timeline: Array<{ date: string; title: string; description: string; type: string }>;
      potential_forecast: string;
    }>('/v1/user/growth_data');
  }
  
  async unlockReadingProgress(articleId: string) {
    return this.request<{ status: string, current_index: number }>(`/v1/reading/progress/${articleId}/unlock`, {
      method: 'POST'
    });
  }

  async resetReadingProgress(articleId: string) {
    return this.request<{ status: string, current_index: number }>(`/v1/reading/progress/${articleId}/reset`, {
      method: 'POST'
    });
  }

  async verifyHandwriting(data: { svg_path: string; target_word: string }) {
    return this.request<{ is_correct: boolean; confidence: number; recognized_text: string }>('/v1/foundation/handwriting/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- New Features (TTS, Duel, Parent) ---

  async getTTS(text: string) {
    // Return blob URL for audio
    const response = await fetch(`${BASE_URL}/v1/foundation/tts?text=${encodeURIComponent(text)}`);
    if (!response.ok) throw new Error('TTS Failed');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async saveDuelRecord(data: any) {
    return this.request<any>('/v1/social/duel/record', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async matchDuelOpponent(stageId: string) {
    return this.request<any>(`/v1/social/duel/match?stage_id=${stageId}`);
  }

  async getWeeklyReport(studentId: string = 'default_user') {
    return this.request<any>(`/v1/parent/weekly_report?student_id=${studentId}`);
  }

  // --- Sync Mechanism ---
  
  async syncOfflineData() {
    if (!navigator.onLine) return;
    
    const queue = getQueue();
    if (queue.length === 0) return;

    console.log(`[Sync] Found ${queue.length} offline items. Syncing...`);
    
    for (const item of queue) {
      try {
        await fetch(`${BASE_URL}${item.url}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        });
        removeFromQueue(item.id);
        console.log(`[Sync] Synced item ${item.id}`);
      } catch (err) {
        console.error(`[Sync] Failed to sync item ${item.id}`, err);
        // Keep in queue if it's a network error, remove if it's a 4xx?
        // For simplicity, we keep it to retry later.
      }
    }
  }
}

export const api = new ApiClient();

// Hook to handle online/offline status and syncing
export const useOfflineSync = () => {
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network restored. Syncing...');
      api.syncOfflineData();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
};
