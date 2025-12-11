import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Action, QuestionItem, QuestionSource } from '../types';
import { BIG_TV_CATEGORIES } from '../constants';

// Keys for localStorage
export const STORAGE_KEY_CUSTOM = 'partybox_question_banks_v1';
export const STORAGE_KEY_HISTORY = 'partybox_played_history_v1';

const initialState: GameState = {
  currentScreen: 'home',
  settings: {
    bigTV: { selectedCategoryId: 'movies', duration: 60, source: 'builtIn' },
    bombQuestion: { minTime: 45, maxTime: 60, source: 'builtIn' },
    bombTap: { minCount: 30, maxCount: 60 },
    wordChain: { topicId: 'food', startLength: 2, source: 'builtIn' },
    forbidden: { source: 'builtIn' },
  },
  customQuestions: {
    bigTV: {},
    bombQuestion: [],
    wordChain: {},
    forbidden: [],
  },
  playedHistory: {
    bigTV: {},
    bombQuestion: [],
    wordChain: {},
    forbidden: [],
  },
  sessionData: {
    score: 0,
    pass: 0,
    timeLeft: 0,
    questionsPlayed: [],
    currentQuestion: undefined,
    bombExploded: false,
    targetCount: 0,
    currentCount: 0,
    wordLength: 2,
  },
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentScreen: action.payload };
    case 'SET_BIGTV_SETTINGS':
      return { ...state, settings: { ...state.settings, bigTV: { ...state.settings.bigTV, ...action.payload } } };
    case 'SET_BOMBQ_SETTINGS':
      return { ...state, settings: { ...state.settings, bombQuestion: { ...state.settings.bombQuestion, ...action.payload } } };
    case 'SET_BOMB_TAP_SETTINGS':
      return { ...state, settings: { ...state.settings, bombTap: { ...state.settings.bombTap, ...action.payload } } };
    case 'SET_WORD_CHAIN_SETTINGS':
      return { ...state, settings: { ...state.settings, wordChain: { ...state.settings.wordChain, ...action.payload } } };
    case 'SET_FORBIDDEN_SETTINGS':
      return { ...state, settings: { ...state.settings, forbidden: { ...state.settings.forbidden, ...action.payload } } };
    
    case 'UPDATE_SESSION':
      return { ...state, sessionData: { ...state.sessionData, ...action.payload } };
    case 'RESET_SESSION':
      return { ...state, sessionData: initialState.sessionData };

    case 'ADD_CUSTOM_QUESTION': {
      const { game, categoryId, question } = action.payload;
      const newState = { ...state, customQuestions: { ...state.customQuestions } };
      
      if (game === 'bigTV' && categoryId) {
        newState.customQuestions.bigTV = {
          ...newState.customQuestions.bigTV,
          [categoryId]: [...(newState.customQuestions.bigTV[categoryId] || []), question]
        };
      } else if (game === 'bombQuestion') {
        newState.customQuestions.bombQuestion = [...newState.customQuestions.bombQuestion, question];
      } else if (game === 'wordChain' && categoryId) {
        newState.customQuestions.wordChain = {
          ...newState.customQuestions.wordChain,
          [categoryId]: [...(newState.customQuestions.wordChain[categoryId] || []), question]
        };
      } else if (game === 'forbidden') {
        newState.customQuestions.forbidden = [...newState.customQuestions.forbidden, question];
      }
      return newState;
    }

    case 'DELETE_CUSTOM_QUESTION': {
      const { game, categoryId, id } = action.payload;
      const newState = { ...state, customQuestions: { ...state.customQuestions } };
      
      if (game === 'bigTV' && categoryId) {
        newState.customQuestions.bigTV = {
          ...newState.customQuestions.bigTV,
          [categoryId]: newState.customQuestions.bigTV[categoryId]?.filter(q => q.id !== id) || []
        };
      } else if (game === 'bombQuestion') {
        newState.customQuestions.bombQuestion = newState.customQuestions.bombQuestion.filter(q => q.id !== id);
      } else if (game === 'wordChain' && categoryId) {
        newState.customQuestions.wordChain = {
          ...newState.customQuestions.wordChain,
          [categoryId]: newState.customQuestions.wordChain[categoryId]?.filter(q => q.id !== id) || []
        };
      } else if (game === 'forbidden') {
        newState.customQuestions.forbidden = newState.customQuestions.forbidden.filter(q => q.id !== id);
      }
      return newState;
    }

    case 'PERSIST_PLAYED_QUESTIONS': {
      const { game, categoryId, ids } = action.payload;
      const newState = { ...state, playedHistory: { ...state.playedHistory } };
      
      if (game === 'bigTV' && categoryId) {
        const current = newState.playedHistory.bigTV[categoryId] || [];
        const newSet = new Set([...current, ...ids]);
        newState.playedHistory.bigTV = {
          ...newState.playedHistory.bigTV,
          [categoryId]: Array.from(newSet)
        };
      } else if (game === 'bombQuestion') {
        const current = newState.playedHistory.bombQuestion;
        const newSet = new Set([...current, ...ids]);
        newState.playedHistory.bombQuestion = Array.from(newSet);
      } else if (game === 'wordChain' && categoryId) {
        const current = newState.playedHistory.wordChain[categoryId] || [];
        const newSet = new Set([...current, ...ids]);
        newState.playedHistory.wordChain = {
           ...newState.playedHistory.wordChain,
           [categoryId]: Array.from(newSet)
        };
      } else if (game === 'forbidden') {
        const current = newState.playedHistory.forbidden;
        const newSet = new Set([...current, ...ids]);
        newState.playedHistory.forbidden = Array.from(newSet);
      }
      return newState;
    }

    case 'RESET_HISTORY': {
      const { game, categoryId } = action.payload;
      
      // Explicitly shallow copy all nested history objects to ensure reference changes
      const newPlayedHistory = {
        bigTV: { ...state.playedHistory.bigTV },
        bombQuestion: [...state.playedHistory.bombQuestion],
        wordChain: { ...state.playedHistory.wordChain },
        forbidden: [...state.playedHistory.forbidden],
      };

      if (game === 'bigTV' && categoryId) {
        newPlayedHistory.bigTV[categoryId] = [];
      } else if (game === 'bombQuestion') {
        newPlayedHistory.bombQuestion = [];
      } else if (game === 'wordChain' && categoryId) {
        newPlayedHistory.wordChain[categoryId] = [];
        // Ensure the object key reference update is propagated if wordChain was structured that way, 
        // though `newPlayedHistory.wordChain` is already a new object.
      } else if (game === 'forbidden') {
        newPlayedHistory.forbidden = [];
      }

      return {
        ...state,
        playedHistory: newPlayedHistory,
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    default:
      return state;
  }
};

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState, (initial) => {
    let loadedState = { ...initial };

    // Load custom questions
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (storedCustom) {
        const parsed = JSON.parse(storedCustom);
        // Robust merge for custom questions
        loadedState.customQuestions = {
          bigTV: { ...initial.customQuestions.bigTV, ...(parsed.bigTV || {}) },
          bombQuestion: parsed.bombQuestion || initial.customQuestions.bombQuestion,
          wordChain: { ...initial.customQuestions.wordChain, ...(parsed.wordChain || {}) },
          forbidden: parsed.forbidden || initial.customQuestions.forbidden,
        };
      }
    } catch (e) {
      console.error("Failed to load custom questions", e);
    }

    // Load history
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        // Robust merge for history
        loadedState.playedHistory = {
          bigTV: { ...initial.playedHistory.bigTV, ...(parsed.bigTV || {}) },
          bombQuestion: Array.isArray(parsed.bombQuestion) ? parsed.bombQuestion : initial.playedHistory.bombQuestion,
          wordChain: { ...initial.playedHistory.wordChain, ...(parsed.wordChain || {}) },
          forbidden: Array.isArray(parsed.forbidden) ? parsed.forbidden : initial.playedHistory.forbidden,
        };
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }

    return loadedState;
  });

  // Save custom questions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(state.customQuestions));
  }, [state.customQuestions]);

  // Save history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(state.playedHistory));
  }, [state.playedHistory]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};