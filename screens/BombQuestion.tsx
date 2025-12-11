import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout, SegmentedControl, HomeButton } from '../components/UI';
import { BOMB_QUESTIONS } from '../constants';
import { QuestionItem } from '../types';
import { Bomb, RefreshCw } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

export const BombQuestionSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, customQuestions, playedHistory } = state;
  
  const handleStart = () => {
    // Determine random time
    const { minTime, maxTime } = state.settings.bombQuestion;
    const targetTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    
    dispatch({ type: 'RESET_SESSION' });
    dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft: targetTime } });
    dispatch({ type: 'NAVIGATE', payload: 'bombQuestionPlay' });
  };

  const getQuestionStats = () => {
    const source = settings.bombQuestion.source;
    let totalItems: QuestionItem[] = [];

    if (source !== 'custom') totalItems = [...totalItems, ...BOMB_QUESTIONS];
    if (source !== 'builtIn') totalItems = [...totalItems, ...customQuestions.bombQuestion];

    const playedIds = new Set(playedHistory.bombQuestion || []);
    const remainingCount = totalItems.filter(q => !playedIds.has(q.id)).length;
    
    return { total: totalItems.length, remaining: remainingCount, played: totalItems.length - remainingCount };
  };

  const stats = getQuestionStats();

  const handleReset = () => {
    if (confirm('確定要重置所有已答過的題目嗎？')) {
      dispatch({ type: 'RESET_HISTORY', payload: { game: 'bombQuestion' } });
    }
  };

  return (
    <ScreenLayout title="倒計時炸彈 - 答問題" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="space-y-6">
        <section>
          <label className="text-sm text-text-sub mb-2 block">題目來源</label>
          <SegmentedControl
            options={[{ value: 'builtIn', label: '內置' }, { value: 'mixed', label: '混合' }, { value: 'custom', label: '自訂' }]}
            value={state.settings.bombQuestion.source}
            onChange={(val) => dispatch({ type: 'SET_BOMBQ_SETTINGS', payload: { source: val } })}
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

        <section>
          <label className="text-sm text-text-sub mb-2 block">時間範圍 (秒)</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '短 (45-60秒)', min: 45, max: 60 },
              { label: '中 (60-90秒)', min: 60, max: 90 },
              { label: '長 (90-120秒)', min: 90, max: 120 },
              { label: '超長 (120-180秒)', min: 120, max: 180 },
              { label: '超超長 (180-240秒)', min: 180, max: 240 },
            ].map(range => (
              <button
                key={range.label}
                onClick={() => dispatch({ type: 'SET_BOMBQ_SETTINGS', payload: { minTime: range.min, maxTime: range.max } })}
                className={`w-full py-4 px-4 rounded-xl font-semibold text-left transition-colors ${
                  state.settings.bombQuestion.minTime === range.min 
                    ? 'bg-primary text-black' 
                    : 'bg-black/20 text-gray-400'
                }`}
              >
                {range.label}
              </button>
            ))}
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

export const BombQuestionPlay: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, sessionData, customQuestions, playedHistory } = state;
  const [exploded, setExploded] = useState(false);
  
  const deck = useMemo(() => {
    let items: QuestionItem[] = [];
    if (settings.bombQuestion.source !== 'custom') items = [...items, ...BOMB_QUESTIONS];
    if (settings.bombQuestion.source !== 'builtIn') items = [...items, ...customQuestions.bombQuestion];
    
    // Filter history
    const playedIds = new Set(playedHistory.bombQuestion || []);
    const available = items.filter(q => !playedIds.has(q.id));

    // If we run out of questions, maybe just show all again? Or handle empty.
    // For now, let's allow repeats if everything is played, otherwise filter.
    const pool = available.length > 0 ? available : items;
    return pool.sort(() => Math.random() - 0.5);
  }, [settings.bombQuestion.source, customQuestions.bombQuestion, playedHistory.bombQuestion]);

  useEffect(() => {
    // Initial Question
    if (!sessionData.currentQuestion && deck.length > 0) {
       dispatch({ type: 'UPDATE_SESSION', payload: { currentQuestion: deck[0], questionsPlayed: [deck[0].id] } });
       // Persist immediately
       dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'bombQuestion', ids: [deck[0].id] } });
    }
  }, [deck, sessionData.currentQuestion, dispatch]);

  useEffect(() => {
    let interval: any;
    if (!exploded && sessionData.timeLeft > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft: sessionData.timeLeft - 1 } });
      }, 1000);
    } else if (sessionData.timeLeft === 0 && !exploded) {
      setExploded(true);
      SoundManager.playSound('explode.mp3');
    }
    return () => clearInterval(interval);
  }, [exploded, sessionData.timeLeft, dispatch]);

  const nextQuestion = () => {
    if (exploded) return;
    
    SoundManager.playSound('pop.mp3');

    const usedIds = new Set(sessionData.questionsPlayed); // Session local
    const available = deck.filter(q => !usedIds.has(q.id));
    
    // If deck runs out in this session, recycle or end.
    const pool = available.length > 0 ? available : deck;
    if (pool.length === 0) return; // Should not happen if deck has items

    const nextQ = pool[Math.floor(Math.random() * pool.length)];

    dispatch({ 
      type: 'UPDATE_SESSION', 
      payload: { 
        currentQuestion: nextQ, 
        questionsPlayed: [...sessionData.questionsPlayed, nextQ.id]
      } 
    });
    
    // Persist
    dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'bombQuestion', ids: [nextQ.id] } });
  };

  if (exploded) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-red-900/80 p-6 text-center animate-pulse">
        <Bomb size={120} className="text-white mb-6" />
        <h1 className="text-5xl font-bold text-white mb-4">爆炸！</h1>
        <p className="text-white/80 text-xl mb-12">依家拎住電話嗰個輸！</p>
        <Button fullWidth variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bombQuestionSetup' })}>
          返回設置
        </Button>
      </div>
    );
  }

  // Ticking tension
  const isUrgent = sessionData.timeLeft < 10;

  return (
    <div className={`h-full flex flex-col p-5 pb-8 pt-5 transition-colors duration-500 ${isUrgent ? 'bg-red-900/20' : ''} relative`}>
      <div className="absolute top-5 right-5 z-10">
        <HomeButton onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })} />
      </div>

      <div className="flex justify-center mb-8 mt-4">
        {/* Hide exact time, show visual indicator or just generic ticking */}
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center animate-pulse ${isUrgent ? 'border-red-500 text-red-500' : 'border-primary text-primary'}`}>
           <div className="text-xs font-bold uppercase tracking-widest">倒數中</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
         <div className="bg-black/20 p-8 rounded-3xl w-full text-center min-h-[200px] flex items-center justify-center">
            <h2 className="text-3xl font-bold">{sessionData.currentQuestion?.text || "載入中..."}</h2>
         </div>
      </div>

      <Button 
        fullWidth 
        className="mt-8 py-6 text-xl" 
        onClick={nextQuestion}
      >
        下一題
      </Button>
    </div>
  );
};
