import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout, SegmentedControl, CountdownOverlay } from '../components/UI';
import { FORBIDDEN_ACTIONS } from '../constants';
import { QuestionItem } from '../types';
import SoundManager from '../utils/SoundManager';
import { RefreshCw } from 'lucide-react';

export const ForbiddenSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, customQuestions, playedHistory } = state;

  const handleStart = () => {
    dispatch({ type: 'RESET_SESSION' });
    dispatch({ type: 'UPDATE_SESSION', payload: { score: 0 } }); // Score tracks violations
    dispatch({ type: 'NAVIGATE', payload: 'forbiddenPlay' });
  };

  const getQuestionStats = () => {
    const source = settings.forbidden.source;
    let totalItems: QuestionItem[] = [];

    if (source !== 'custom') totalItems = [...totalItems, ...FORBIDDEN_ACTIONS];
    if (source !== 'builtIn') totalItems = [...totalItems, ...customQuestions.forbidden];

    const playedIds = new Set(playedHistory.forbidden || []);
    const remainingCount = totalItems.filter(q => !playedIds.has(q.id)).length;

    return { total: totalItems.length, remaining: remainingCount, played: totalItems.length - remainingCount };
  };

  const stats = getQuestionStats();

  const handleReset = () => {
    if (confirm('確定要重置已玩記錄嗎？')) {
      dispatch({ type: 'RESET_HISTORY', payload: { game: 'forbidden' } });
    }
  };

  return (
    <ScreenLayout title="不要做挑戰" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="space-y-6">
        <section>
          <label className="text-sm text-text-sub mb-2 block">題目來源</label>
          <SegmentedControl
            options={[{ value: 'builtIn', label: '內置' }, { value: 'mixed', label: '混合' }, { value: 'custom', label: '自訂' }]}
            value={state.settings.forbidden.source}
            onChange={(val) => dispatch({ type: 'SET_FORBIDDEN_SETTINGS', payload: { source: val } })}
          />
           <div className="flex justify-end items-center mt-2 gap-2">
            <span className="text-xs text-text-sub">剩餘 {stats.remaining} 題</span>
            {stats.played > 0 && (
              <button 
                onClick={handleReset} 
                className="text-xs flex items-center gap-1 text-primary hover:text-white transition-colors"
              >
                <RefreshCw size={12} /> 重置
              </button>
            )}
          </div>
        </section>
        <Button 
          fullWidth 
          onClick={handleStart} 
          className="mt-8"
          disabled={stats.remaining === 0}
        >
          {stats.remaining === 0 ? '沒有題目了' : '開始遊戲'}
        </Button>
      </div>
    </ScreenLayout>
  );
};

export const ForbiddenPlay: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, sessionData, customQuestions, playedHistory } = state;
  const [showCountdown, setShowCountdown] = useState(true);

  const deck = useMemo(() => {
    let items: QuestionItem[] = [];
    if (settings.forbidden.source !== 'custom') items = [...items, ...FORBIDDEN_ACTIONS];
    if (settings.forbidden.source !== 'builtIn') items = [...items, ...customQuestions.forbidden];
    
    const playedIds = new Set(playedHistory.forbidden || []);
    const available = items.filter(q => !playedIds.has(q.id));
    const pool = available.length > 0 ? available : items;

    return pool.sort(() => Math.random() - 0.5);
  }, [settings.forbidden.source, customQuestions.forbidden, playedHistory.forbidden]);

  // Init
  if (!sessionData.currentQuestion && deck.length > 0) {
    dispatch({ type: 'UPDATE_SESSION', payload: { currentQuestion: deck[0], questionsPlayed: [deck[0].id] } });
    dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'forbidden', ids: [deck[0].id] } });
  }

  const nextQ = () => {
    const usedIds = new Set(sessionData.questionsPlayed);
    const available = deck.filter(q => !usedIds.has(q.id));
    
    // loop if empty (or could stop)
    const pool = available.length > 0 ? available : deck;
    if (pool.length === 0) return;

    const next = pool[Math.floor(Math.random() * pool.length)];
    dispatch({ type: 'UPDATE_SESSION', payload: { currentQuestion: next, questionsPlayed: [...sessionData.questionsPlayed, next.id] } });
    
    dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'forbidden', ids: [next.id] } });
  };

  const handleSafe = () => {
    SoundManager.playSound('pop.mp3');
    nextQ();
  }

  const handleViolation = () => {
    SoundManager.playSound('correct.mp3'); // Per spec: Correct/Confirm sound for violation
    dispatch({ type: 'UPDATE_SESSION', payload: { score: sessionData.score + 1 } });
    nextQ();
  };

  return (
    <ScreenLayout title="不要做挑戰" onHome={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      {showCountdown && <CountdownOverlay onComplete={() => setShowCountdown(false)} />}
      
      <div className="h-full flex flex-col items-center">
         <div className="w-full bg-black/20 rounded-3xl p-8 mb-8 text-center flex-1 flex flex-col items-center justify-center border-2 border-danger/30">
            <h2 className="text-text-sub text-xl mb-4">不要做...</h2>
            {/* Hide text during countdown to prevent peeking */}
            <div className={`text-4xl font-bold text-white ${showCountdown ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
              {sessionData.currentQuestion?.text}
            </div>
         </div>

         <div className="w-full text-center mb-8">
           <div className="text-sm text-text-sub">違規次數</div>
           <div className="text-5xl font-bold text-danger">{sessionData.score}</div>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full">
            <Button variant="secondary" onClick={handleSafe} disabled={showCountdown}>無人違規 (跳過)</Button>
            <Button variant="danger" onClick={handleViolation} disabled={showCountdown}>有人違規</Button>
         </div>
      </div>
    </ScreenLayout>
  );
};