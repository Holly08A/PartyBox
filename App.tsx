import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './screens/HomeScreen';
import { BigTVSetup, BigTVPlay, BigTVResult } from './screens/BigTV';
import { BombQuestionSetup, BombQuestionPlay } from './screens/BombQuestion';
import { BombTapSetup, BombTapPlay } from './screens/BombTap';
import { WordChainSetup, WordChainPlay } from './screens/WordChain';
import { ForbiddenSetup, ForbiddenPlay } from './screens/Forbidden';
import { CustomManager } from './screens/CustomManager';

const ScreenRouter = () => {
  const { state } = useGame();

  switch (state.currentScreen) {
    case 'home':
      return <HomeScreen />;
    
    // Big TV
    case 'bigTVSetup':
      return <BigTVSetup />;
    case 'bigTVPlay':
      return <BigTVPlay />;
    case 'bigTVResult':
      return <BigTVResult />;

    // Bomb Question
    case 'bombQuestionSetup':
      return <BombQuestionSetup />;
    case 'bombQuestionPlay':
      return <BombQuestionPlay />;

    // Bomb Tap
    case 'bombTapSetup':
      return <BombTapSetup />;
    case 'bombTapPlay':
      return <BombTapPlay />;

    // Word Chain
    case 'wordChainSetup':
      return <WordChainSetup />;
    case 'wordChainPlay':
      return <WordChainPlay />;

    // Forbidden
    case 'forbiddenSetup':
      return <ForbiddenSetup />;
    case 'forbiddenPlay':
      return <ForbiddenPlay />;

    // Custom
    case 'customManager':
      return <CustomManager />;

    default:
      return <HomeScreen />;
  }
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <div className="min-h-screen w-full max-w-md mx-auto relative overflow-hidden flex flex-col">
        <ScreenRouter />
      </div>
    </GameProvider>
  );
};

export default App;