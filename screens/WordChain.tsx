import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout, SegmentedControl, HomeButton } from '../components/UI';
import { WORD_CHAIN_TOPICS } from '../constants';
import { QuestionItem } from '../types';
import SoundManager from '../utils/SoundManager';
import { RefreshCw } from 'lucide-react';

export const WordChainSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, customQuestions, playedHistory } = state;

  const handleStart = () => {
    dispatch({ type: 'RESET_SESSION' });
    dispatch({ type: 'UPDATE_SESSION', payload: { wordLength: settings.wordChain.startLength } });
    dispatch({ type: 'NAVIGATE', payload: 'wordChainPlay' });
  };

  const getTopicStats = (topicId: string) => {
    const source = settings.wordChain.source;
    let totalItems: QuestionItem[] = [];

    if (source !== 'custom') {
      const topic = WORD_CHAIN_TOPICS.find(t => t.id === topicId);
      if (topic) totalItems = [...totalItems, ...topic.items];
    }
    if (source !== 'builtIn') {
      totalItems = [...totalItems, ...(customQuestions.wordChain[topicId] || [])];
    }

    const playedIds = new Set(playedHistory.wordChain[topicId] || []);
    const remainingCount = totalItems.filter(q => !playedIds.has(q.id)).length;
    
    return { total: totalItems.length, remaining: remainingCount, played: totalItems.length - remainingCount };
  };

  const handleResetHistory = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (confirm('確定要重置此主題的記錄嗎？')) {
      dispatch({ type: 'RESET_HISTORY', payload: { game: 'wordChain', categoryId: topicId } });
    }
  };

  const currentTopicStats = getTopicStats(settings.wordChain.topicId);

  return (
    <ScreenLayout title="字數版撞機" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="space-y-6">
        <section>
          <label className="text-sm text-text-sub mb-2 block">題目來源</label>
          <SegmentedControl
            options={[{ value: 'builtIn', label: '內置' }, { value: 'mixed', label: '混合' }, { value: 'custom', label: '自訂' }]}
            value={settings.wordChain.source}
            onChange={(val) => dispatch({ type: 'SET_WORD_CHAIN_SETTINGS', payload: { source: val } })}
          />
        </section>

        <section>
          <label className="text-sm text-text-sub mb-2 block">起始字數</label>
          <div className="flex gap-4">
             {[2, 3].map(len => (
               <button
                 key={len}
                 onClick={() => dispatch({ type: 'SET_WORD_CHAIN_SETTINGS', payload: { startLength: len } })}
                 className={`flex-1 py-4 rounded-xl font-bold text-xl ${settings.wordChain.startLength === len ? 'bg-primary text-black' : 'bg-black/20 text-gray-400'}`}
               >
                 {len} 字
               </button>
             ))}
          </div>
        </section>

        <section>
          <label className="text-sm text-text-sub mb-2 block">題目主題</label>
          <div className="grid grid-cols-2 gap-3">
            {WORD_CHAIN_TOPICS.map(topic => {
              const stats = getTopicStats(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => dispatch({ type: 'SET_WORD_CHAIN_SETTINGS', payload: { topicId: topic.id } })}
                  className={`p-4 rounded-xl text-left font-semibold flex flex-col relative ${settings.wordChain.topicId === topic.id ? 'bg-primary text-black' : 'bg-black/20 text-white'}`}
                >
                  <span>{topic.name}</span>
                  <span className={`text-xs mt-1 ${settings.wordChain.topicId === topic.id ? 'text-black/60' : 'text-gray-400'}`}>
                    剩餘 {stats.remaining} 題
                  </span>

                  {stats.played > 0 && (
                    <div 
                      onClick={(e) => handleResetHistory(e, topic.id)}
                      className={`absolute bottom-2 right-2 p-1.5 rounded-full hover:bg-black/10 ${settings.wordChain.topicId === topic.id ? 'text-black/60' : 'text-gray-400'}`}
                    >
                      <RefreshCw size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <Button 
          fullWidth 
          onClick={handleStart} 
          className="mt-8"
          disabled={currentTopicStats.remaining === 0}
        >
          {currentTopicStats.remaining === 0 ? '沒有題目了' : '開始遊戲'}
        </Button>
      </div>
    </ScreenLayout>
  );
};

export const WordChainPlay: React.FC = () => {
  const { state, dispatch } = useGame();
  const { settings, sessionData, customQuestions, playedHistory } = state;
  const [gameOver, setGameOver] = useState(false);

  const deck = useMemo(() => {
    const topicId = settings.wordChain.topicId;
    let items: QuestionItem[] = [];
    
    if (settings.wordChain.source !== 'custom') {
      const topic = WORD_CHAIN_TOPICS.find(t => t.id === topicId);
      if (topic) items = [...items, ...topic.items];
    }
    if (settings.wordChain.source !== 'builtIn') {
      items = [...items, ...(customQuestions.wordChain[topicId] || [])];
    }

    const playedIds = new Set(playedHistory.wordChain[topicId] || []);
    const available = items.filter(q => !playedIds.has(q.id));
    // If empty, fallback to all (or show error?)
    return (available.length > 0 ? available : items).sort(() => Math.random() - 0.5);
  }, [settings, customQuestions, playedHistory.wordChain]);

  // Load first question if needed
  if (!sessionData.currentQuestion && deck.length > 0) {
    dispatch({ type: 'UPDATE_SESSION', payload: { currentQuestion: deck[0], questionsPlayed: [deck[0].id] } });
    dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'wordChain', categoryId: settings.wordChain.topicId, ids: [deck[0].id] } });
  }

  const handleNext = () => {
    SoundManager.playSound('pop.mp3');
    // Increment word length logic: 2 -> 3 -> 4...
    // Actually spec says: Player 1 says 2 words, Player 2 says 3 words.
    // So every "Next" click increases length.
    
    const newLen = (sessionData.wordLength || 2) + 1;
    dispatch({ type: 'UPDATE_SESSION', payload: { wordLength: newLen } });
  };

  const handleNextRound = () => {
     SoundManager.playSound('pop.mp3');
     // Pick new topic/question, reset length to start
     const usedIds = new Set(sessionData.questionsPlayed);
     const available = deck.filter(q => !usedIds.has(q.id));
     
     if (available.length === 0) {
       alert("沒有更多題目了！");
       return;
     }
     
     const nextQ = available[0];
     dispatch({ 
        type: 'UPDATE_SESSION', 
        payload: { 
          currentQuestion: nextQ, 
          questionsPlayed: [...sessionData.questionsPlayed, nextQ.id],
          wordLength: settings.wordChain.startLength
        } 
      });

     // Persist
     dispatch({ type: 'PERSIST_PLAYED_QUESTIONS', payload: { game: 'wordChain', categoryId: settings.wordChain.topicId, ids: [nextQ.id] } });
  };

  if (gameOver) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-bold text-danger mb-4">遊戲結束！</h2>
        <div className="text-xl mb-8">失敗於 <span className="font-bold text-primary">{sessionData.wordLength}</span> 字</div>
        <Button fullWidth onClick={() => dispatch({ type: 'NAVIGATE', payload: 'wordChainSetup' })}>返回設置</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-5 pb-8 pt-5 relative">
      <div className="absolute top-5 right-5 z-10">
        <HomeButton onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })} />
      </div>

      <div className="bg-black/20 rounded-2xl p-6 mb-6 mt-12 text-center">
        <div className="text-sm text-text-sub mb-2">題目主題</div>
        <div className="text-3xl font-bold">{sessionData.currentQuestion?.text}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-8xl font-bold text-primary mb-2">{sessionData.wordLength}</div>
        <div className="text-text-sub">當前字數</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button onClick={handleNext} className="py-6 text-xl">報到，下一個</Button>
        <div className="grid grid-cols-2 gap-4">
           <Button variant="secondary" onClick={handleNextRound}>換題目</Button>
           <Button variant="danger" onClick={() => setGameOver(true)}>有人出錯/撞機</Button>
        </div>
      </div>
    </div>
  );
};