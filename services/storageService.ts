import { AppState, ChatMessage } from "../types";

const STORAGE_KEY = 'postpartum_ai_v1';

const defaultState: AppState = {
  profile: null,
  plan: null,
  logs: {},
  settings: {
    remindersEnabled: false,
    theme: 'light'
  },
  hasAgreedToTerms: false,
  chatHistory: []
};

export const saveState = (state: Partial<AppState>) => {
  try {
    const current = loadState();
    const newState = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  } catch (e) {
    return defaultState;
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch (e) {
    console.error("Failed to clear state", e);
  }
};

export const getTodayDate = () => new Date().toISOString().split('T')[0];

export const toggleExerciseCompletion = (exerciseName: string, date: string = getTodayDate()) => {
  const state = loadState();
  const todaysLog = state.logs[date] || [];
  
  let newLog;
  if (todaysLog.includes(exerciseName)) {
    newLog = todaysLog.filter(e => e !== exerciseName);
  } else {
    newLog = [...todaysLog, exerciseName];
  }

  const newLogs = { ...state.logs, [date]: newLog };
  saveState({ logs: newLogs });
  return newLogs;
};

export const saveChatMessage = (message: ChatMessage) => {
  const state = loadState();
  const newHistory = [...(state.chatHistory || []), message];
  // Limit history to last 50 messages to prevent storage bloat
  if (newHistory.length > 50) newHistory.shift();
  saveState({ chatHistory: newHistory });
  return newHistory;
};

export const calculateStreak = (logs: Record<string, string[]>) => {
  const dates = Object.keys(logs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (dates.length === 0) return 0;

  const today = getTodayDate();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let currentCheckDate = (dates[0] === today || dates[0] === yesterday) ? dates[0] : null;

  if (!currentCheckDate) return 0;

  return dates.length; // Simplified streak for MVP
};
