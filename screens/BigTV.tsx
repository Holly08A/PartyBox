import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout, SegmentedControl, HomeButton, CountdownOverlay } from '../components/UI';
import { BIG_TV_CATEGORIES } from '../constants';
import { QuestionItem } from '../types';
import { RotateCcw, RefreshCw } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

export const BigTVSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, customQuestions, playedHistory } = state;
  
  const categories = BIG_TV_CATEGORIES;

  const handleStart = () => {
    dispatch({ type: 'RESET_SESSION' });
    dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft: settings.bigTV.duration } });
    dispatch({ type: 'NAVIGATE', payload: 'bigTVPlay' });
  };

  const getCategoryStats = (catId: string) => {
    const source = settings.bigTV.source;
    let totalItems: QuestionItem[] = [];

    if (source !== 'custom') {
      const builtInCat = BIG_TV_CATEGORIES.find(c => c.id === catId);
      if (builtInCat) totalItems = [...totalItems, ...builtInCat.items];
    }
    if (source !== 'builtIn') {
      const customItems = customQuestions.bigTV[catId] || [];
      totalItems = [...totalItems, ...customItems];
    }

    const playedIds = new Set(playedHistory.bigTV[catId] || []);
    // Calculate how many items are available (not played)
    const remainingCount = totalItems.filter(item => !playedIds.has(item.id)).length;
    const playedCount = totalItems.length - remainingCount;

    return { total: totalItems.length, remaining: remainingCount, played: playedCount };
  };

  const handleResetHistory = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    if (confirm('確定要重置此類別的已玩記錄嗎？題目將會重新出現。')) {
      dispatch({ type: 'RESET_HISTORY', payload: { game: 'bigTV', categoryId: catId } });
    }
  };

  const currentCategoryStats = getCategoryStats(settings.bigTV.selectedCategoryId);

  return (
    <ScreenLayout title="大電視" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="space-y-6">
        <section>
          <label className="text-sm text-text-sub mb-2 block">題目來源</label>
          <SegmentedControl
            options={[
              { value: 'builtIn', label: '內置' },
              { value: 'mixed', label: '混合' },
              { value: 'custom', label: '自訂' }
            ]}
            value={settings.bigTV.source}
            onChange={(val) => dispatch({ type: 'SET_BIGTV_SETTINGS', payload: { source: val } })}
          />
        </section>

        <section>
          <label className="text-sm text-text-sub mb-2 block">遊戲時間</label>
          <div className="flex gap-2">
            {[60, 90, 120].map(time => (
              <button
                key={time}
                onClick={() => dispatch({ type: 'SET_BIGTV_SETTINGS', payload: { duration: time } })}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  settings.bigTV.duration === time 
                    ? 'bg-primary text-black' 
                    : 'bg-black/20 text-gray-400'
                }`}
              >
                {time}秒
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-sm text-text-sub mb-2 block">題目類別</label>
          <div className="grid grid-cols-2 gap-4">
            {categories.map(cat => {
              const stats = getCategoryStats(cat.id);
              return (
                <div 
                  key={cat.id}
                  onClick={() => dispatch({ type: 'SET_BIGTV_SETTINGS', payload: { selectedCategoryId: cat.id } })}
                  className={`p-5 rounded-2xl relative transition-all active:scale-95 cursor-pointer ${
                    settings.bigTV.selectedCategoryId === cat.id
                      ? 'bg-primary text-black'
                      : 'bg-black/20 text-white'
                  }`}
                >
                  <div className="font-bold text-lg">{cat.nameZh}</div>
                  <div className={`text-xs ${settings.bigTV.selectedCategoryId === cat.id ? 'text-black/60' : 'text-gray-400'}`}>{cat.nameEn}</div>
                  <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${settings.bigTV.selectedCategoryId === cat.id ? 'text-black/70' : 'text-gray-500'}`}>
                    剩餘 {stats.remaining} 題
                  </div>
                  
                  {/* Reset Button (Only if played > 0) */}
                  {stats.played > 0 && (
                    <button 
                      onClick={(e) => handleResetHistory(e, cat.id)}
                      className={`absolute bottom-3 right-3 p-1.5 rounded-full hover:bg-black/10 z-10 ${settings.bigTV.selectedCategoryId === cat.id ? 'text-black/60' : 'text-gray-400'}`}
                      title="重置題目"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}

                  {cat.label && (
                    <div className="absolute top-2 right-2 text-xs opacity-50 border px-1.5 py-0.5 rounded border-current">
                      {cat.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <Button 
          fullWidth 
          onClick={handleStart} 
          className="mt-8"
          disabled={currentCategoryStats.remaining === 0}
        >
          {currentCategoryStats.remaining === 0 ? '沒有題目了' : '開始遊戲'}
        </Button>
      </div>
    </ScreenLayout>
  );
};

export const BigTVPlay: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, sessionData, customQuestions, playedHistory } = state;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  
  // Initialize Question Deck (Filtered by history)
  const deck = useMemo(() => {
    let items: QuestionItem[] = [];
    const catId = settings.bigTV.selectedCategoryId;
    
    // 1. Gather all candidates
    if (settings.bigTV.source !== 'custom') {
      const builtInCat = BIG_TV_CATEGORIES.find(c => c.id === catId);
      if (builtInCat) items = [...items, ...builtInCat.items];
    }
    if (settings.bigTV.source !== 'builtIn') {
      const customItems = customQuestions.bigTV[catId] || [];
      items = [...items, ...customItems];
    }
    
    // 2. Filter out played
    const playedIds = new Set(playedHistory.bigTV[catId] || []);
    const availableItems = items.filter(q => !playedIds.has(q.id));

    // 3. Shuffle
    return availableItems.sort(() => Math.random() - 0.5);
  }, [settings.bigTV.source, settings.bigTV.selectedCategoryId, customQuestions.bigTV, playedHistory.bigTV]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isPlaying && !showCountdown && sessionData.timeLeft > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft: sessionData.timeLeft - 1 } });
      }, 1000);
    } else if (sessionData.timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      SoundManager.playSound('alarm.mp3');
      dispatch({ type: 'NAVIGATE', payload: 'bigTVResult' });
    }
    return () => clearInterval(interval);
  }, [isPlaying, showCountdown, sessionData.timeLeft, dispatch]);

  const handleNext = (correct: boolean) => {
    if (!isPlaying) return;
    
    if (correct) {
      SoundManager.playSound('correct.mp3');
    } else {
      SoundManager.playSound('pop.mp3');
    }

    // Persist CURRENT question as played
    if (sessionData.currentQuestion) {
       dispatch({ 
         type: 'PERSIST_PLAYED_QUESTIONS', 
         payload: { 
           game: 'bigTV', 
           categoryId: settings.bigTV.selectedCategoryId, 
           ids: [sessionData.currentQuestion.id] 
         }
       });
    }

    // Get next
    // Note: sessionData.questionsPlayed tracks *this session*. 
    // deck is already filtered for *previous sessions*.
    // We need to filter deck against *current session* usage too.
    const usedInSession = new Set(sessionData.questionsPlayed);
    const available = deck.filter(q => !usedInSession.has(q.id));
    
    if (available.length === 0) {
      setIsPlaying(false);
      dispatch({ type: 'NAVIGATE', payload: 'bigTVResult' });
      return;
    }

    const nextQ = available[0];
    
    dispatch({ 
      type: 'UPDATE_SESSION', 
      payload: { 
        score: correct ? sessionData.score + 1 : sessionData.score,
        pass: correct ? sessionData.pass : sessionData.pass + 1,
        questionsPlayed: [...sessionData.questionsPlayed, nextQ.id],
        currentQuestion: nextQ
      } 
    });
  };

  const handleStartClick = () => {
    if (deck.length === 0) return alert("所有題目已玩完！請在設置頁面重置。");
    setShowCountdown(true);
    dispatch({ type: 'UPDATE_SESSION', payload: { score: 0, pass: 0, questionsPlayed: [deck[0].id], currentQuestion: deck[0] } });
  };

  const onCountdownComplete = () => {
    setShowCountdown(false);
    setIsPlaying(true);
  };

  if (!isPlaying && !showCountdown && sessionData.timeLeft === settings.bigTV.duration) {
    return (
      <div className="flex-1 flex flex-col items-center p-6 text-center relative w-full h-full">
        <div className="absolute top-5 right-5 z-10">
           <HomeButton onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="text-[120px] font-bold text-primary leading-none">
            {sessionData.timeLeft}
            </div>
            <p className="text-text-sub text-xl mt-4">準備好未！</p>
        </div>

        <div className="w-full max-w-xs mb-8 z-10">
            <Button onClick={handleStartClick} fullWidth className="text-xl py-6">開始</Button>
            <Button variant="ghost" className="mt-4 w-full" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bigTVSetup' })}>取消</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-5 pb-8 pt-5 relative h-full">
      {showCountdown && <CountdownOverlay onComplete={onCountdownComplete} />}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
         <div className="flex-1">
             <div className="text-6xl font-bold text-primary tabular-nums leading-none">{sessionData.timeLeft}</div>
         </div>
         
         <div className="flex gap-4">
            <div className="text-right text-sm text-text-sub">
              <div>答對: <span className="text-success">{sessionData.score}</span></div>
              <div>跳過: <span className="text-white">{sessionData.pass}</span></div>
            </div>
            <HomeButton onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })} className="-mt-1 -mr-2" />
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-3xl p-8 mb-8 shadow-inner border border-white/5">
        <h2 className="text-4xl font-bold text-center leading-tight mb-2">
          {sessionData.currentQuestion?.text}
        </h2>
        {sessionData.currentQuestion?.en && (
          <p className="text-xl text-text-sub text-center">{sessionData.currentQuestion.en}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 h-24">
        <button 
          onClick={() => handleNext(false)}
          className="bg-gray-700 active:bg-gray-600 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-300"
        >
          跳過
        </button>
        <button 
          onClick={() => handleNext(true)}
          className="bg-success active:bg-green-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
        >
          正確
        </button>
      </div>
    </div>
  );
};

export const BigTVResult: React.FC = () => {
  const { state, dispatch } = useGame();
  
  return (
    <ScreenLayout noPadding onHome={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-black/40">
        <h2 className="text-3xl font-bold text-white mb-8">時間到！</h2>
        
        <div className="grid grid-cols-2 gap-8 w-full max-w-xs mb-12">
           <div className="bg-black/30 p-6 rounded-2xl">
             <div className="text-text-sub text-sm mb-1">答對</div>
             <div className="text-5xl font-bold text-success">{state.sessionData.score}</div>
           </div>
           <div className="bg-black/30 p-6 rounded-2xl">
             <div className="text-text-sub text-sm mb-1">跳過</div>
             <div className="text-5xl font-bold text-text-sub">{state.sessionData.pass}</div>
           </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Button fullWidth onClick={() => {
             dispatch({ type: 'RESET_SESSION' });
             dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft: state.settings.bigTV.duration } });
             dispatch({ type: 'NAVIGATE', payload: 'bigTVPlay' });
          }}>
            <RotateCcw size={20} /> 再玩一次
          </Button>
          <Button variant="secondary" fullWidth onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
            返回主頁
          </Button>
        </div>
      </div>
    </ScreenLayout>
  );
}