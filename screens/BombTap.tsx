import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout, HomeButton, CountdownOverlay } from '../components/UI';
import { Zap } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

export const BombTapSetup: React.FC = () => {
  const { state, dispatch } = useGame();

  const handleStart = () => {
    const { minCount, maxCount } = state.settings.bombTap;
    const target = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    
    dispatch({ type: 'RESET_SESSION' });
    dispatch({ type: 'UPDATE_SESSION', payload: { targetCount: target, currentCount: target } });
    dispatch({ type: 'NAVIGATE', payload: 'bombTapPlay' });
  };

  return (
    <ScreenLayout title="倒計時炸彈 - 點擊屏幕" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="space-y-6">
        <section>
          <label className="text-sm text-text-sub mb-2 block">點擊次數範圍</label>
          <div className="space-y-2">
            {[
              { label: '30 - 60', min: 30, max: 60 },
              { label: '60 - 100', min: 60, max: 100 },
              { label: '100 - 150', min: 100, max: 150 },
            ].map(range => (
              <button
                key={range.label}
                onClick={() => dispatch({ type: 'SET_BOMB_TAP_SETTINGS', payload: { minCount: range.min, maxCount: range.max } })}
                className={`w-full py-4 px-4 rounded-xl font-semibold text-left transition-colors ${
                  state.settings.bombTap.minCount === range.min 
                    ? 'bg-primary text-black' 
                    : 'bg-black/20 text-gray-400'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </section>
        <Button fullWidth onClick={handleStart} className="mt-8">開始遊戲</Button>
      </div>
    </ScreenLayout>
  );
};

export const BombTapPlay: React.FC = () => {
  const { state, dispatch } = useGame();
  const { sessionData } = state;
  const [exploded, setExploded] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);

  const handleTap = () => {
    if (exploded || showCountdown) return;
    
    SoundManager.playSound('tab.mp3');

    const newCount = (sessionData.currentCount || 0) - 1;
    
    if (newCount <= 0) {
      setExploded(true);
      SoundManager.playSound('explode.mp3');
      dispatch({ type: 'UPDATE_SESSION', payload: { currentCount: 0 } });
    } else {
      dispatch({ type: 'UPDATE_SESSION', payload: { currentCount: newCount } });
    }
  };

  if (exploded) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/95 p-6 text-center">
        <Zap size={100} className="text-yellow-400 mb-6 animate-bounce" />
        <h1 className="text-5xl font-bold text-white mb-4">爆炸！</h1>
        <Button fullWidth variant="secondary" className="mt-8" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bombTapSetup' })}>
          再玩一次
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 w-full min-h-full flex flex-col items-center justify-center bg-black/40 touch-none select-none cursor-pointer active:bg-black/30 transition-colors relative"
      onClick={handleTap}
    >
      {showCountdown && <CountdownOverlay onComplete={() => setShowCountdown(false)} />}
      
      <div className="absolute top-5 right-5 z-20">
        <HomeButton onClick={() => dispatch({ type: 'NAVIGATE', payload: 'home' })} />
      </div>

      <div className="pointer-events-none text-center p-6">
        <h2 className="text-3xl font-bold text-white mb-4 opacity-50">點擊屏幕！</h2>
        <div className="text-8xl font-bold text-primary opacity-20">{sessionData.currentCount}</div>
        <p className="mt-8 text-text-sub">唔好做最後一個...</p>
      </div>
    </div>
  );
};