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

// Returns YYYY-MM-DD in User's Local Timezone (Not UTC)
export const getTodayDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

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
  const today = getTodayDate();
  
  // Calculate yesterday in Local Time
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localNow = new Date(d.getTime() - (offset * 60 * 1000));
  localNow.setDate(localNow.getDate() - 1);
  const yesterday = localNow.toISOString().split('T')[0];

  let streak = 0;
  
  // A streak is active if we have logs for Today OR Yesterday.
  // We start checking backwards from the most recent active day.
  let currentCheckDate: string | null = null;

  if (logs[today] && logs[today].length > 0) {
    currentCheckDate = today;
  } else if (logs[yesterday] && logs[yesterday].length > 0) {
    currentCheckDate = yesterday;
  } else {
    return 0; // Streak broken
  }

  // Iterate backwards to count consecutive days
  while (currentCheckDate) {
    if (logs[currentCheckDate] && logs[currentCheckDate].length > 0) {
      streak++;
      // Go to previous day
      // Note: We use the date string to construct UTC date for math, which is safe for YYYY-MM-DD arithmetic
      const prev = new Date(currentCheckDate);
      prev.setDate(prev.getDate() - 1);
      currentCheckDate = prev.toISOString().split('T')[0];
    } else {
      break; 
    }
  }

  return streak;
};