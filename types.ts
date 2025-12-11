
export type ScreenName =
  | 'home'
  | 'bigTVSetup' | 'bigTVPlay' | 'bigTVResult'
  | 'bombQuestionSetup' | 'bombQuestionPlay'
  | 'bombTapSetup' | 'bombTapPlay'
  | 'wordChainSetup' | 'wordChainPlay'
  | 'forbiddenSetup' | 'forbiddenPlay'
  | 'customManager';

export type QuestionSource = 'builtIn' | 'mixed' | 'custom';

export interface QuestionItem {
  id: string;
  text: string;
  en?: string;
}

export interface BigTVCategory {
  id: string;
  nameZh: string;
  nameEn?: string;
  label?: string;
  items: QuestionItem[];
}

export interface GameSettings {
  bigTV: {
    selectedCategoryId: string;
    duration: number;
    source: QuestionSource;
  };
  bombQuestion: {
    minTime: number;
    maxTime: number;
    source: QuestionSource;
  };
  bombTap: {
    minCount: number;
    maxCount: number;
  };
  wordChain: {
    topicId: string;
    startLength: number;
    source: QuestionSource;
  };
  forbidden: {
    source: QuestionSource;
  };
}

export interface GameState {
  currentScreen: ScreenName;
  settings: GameSettings;
  customQuestions: {
    bigTV: Record<string, QuestionItem[]>; // Keyed by category ID
    bombQuestion: QuestionItem[];
    wordChain: Record<string, QuestionItem[]>; // Keyed by topic ID
    forbidden: QuestionItem[];
  };
  playedHistory: {
    bigTV: Record<string, string[]>; // Keyed by category ID, stores Item IDs
    bombQuestion: string[];
    wordChain: Record<string, string[]>; // Keyed by topic ID
    forbidden: string[];
  };
  sessionData: {
    score: number;
    pass: number;
    timeLeft: number;
    questionsPlayed: string[]; // IDs played in CURRENT session
    currentQuestion?: QuestionItem;
    bombExploded?: boolean;
    targetCount?: number;
    currentCount?: number;
    wordLength?: number;
  };
}

export type Action =
  | { type: 'NAVIGATE'; payload: ScreenName }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'SET_BIGTV_SETTINGS'; payload: Partial<GameSettings['bigTV']> }
  | { type: 'SET_BOMBQ_SETTINGS'; payload: Partial<GameSettings['bombQuestion']> }
  | { type: 'SET_BOMB_TAP_SETTINGS'; payload: Partial<GameSettings['bombTap']> }
  | { type: 'SET_WORD_CHAIN_SETTINGS'; payload: Partial<GameSettings['wordChain']> }
  | { type: 'SET_FORBIDDEN_SETTINGS'; payload: Partial<GameSettings['forbidden']> }
  | { type: 'ADD_CUSTOM_QUESTION'; payload: { game: 'bigTV' | 'bombQuestion' | 'wordChain' | 'forbidden'; categoryId?: string; question: QuestionItem } }
  | { type: 'DELETE_CUSTOM_QUESTION'; payload: { game: 'bigTV' | 'bombQuestion' | 'wordChain' | 'forbidden'; categoryId?: string; id: string } }
  | { type: 'UPDATE_SESSION'; payload: Partial<GameState['sessionData']> }
  | { type: 'RESET_SESSION' }
  // History Actions
  | { type: 'PERSIST_PLAYED_QUESTIONS'; payload: { game: 'bigTV' | 'bombQuestion' | 'wordChain' | 'forbidden'; categoryId?: string; ids: string[] } }
  | { type: 'RESET_HISTORY'; payload: { game: 'bigTV' | 'bombQuestion' | 'wordChain' | 'forbidden'; categoryId?: string } };
