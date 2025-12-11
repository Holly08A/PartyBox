import React from 'react';
import { useGame } from '../context/GameContext';
import { Card, Button } from '../components/UI';
import { Tv, Bomb, Zap, Link as LinkIcon, Ban, ChevronRight, Settings } from 'lucide-react';

interface GameCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, subtitle, icon, onClick }) => (
  <Card onClick={onClick} className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-text-sub">{subtitle}</p>
      </div>
    </div>
    <ChevronRight className="text-primary opacity-60 group-active:opacity-100" />
  </Card>
);

export const HomeScreen: React.FC = () => {
  const { dispatch } = useGame();

  return (
    <div className="flex flex-col h-full px-5 pt-10 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">PartyBox</h1>
        <p className="text-text-sub">派對遊戲工具箱</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        <GameCard
          title="大電視"
          subtitle="Big TV"
          icon={<Tv size={24} />}
          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bigTVSetup' })}
        />
        <GameCard
          title="倒計時炸彈 - 答問題"
          subtitle="Bomb Question"
          icon={<Bomb size={24} />}
          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bombQuestionSetup' })}
        />
        <GameCard
          title="倒計時炸彈 - 點擊屏幕"
          subtitle="Bomb Tap"
          icon={<Zap size={24} />}
          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'bombTapSetup' })}
        />
        <GameCard
          title="字數版撞機"
          subtitle="Word Chain"
          icon={<LinkIcon size={24} />}
          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'wordChainSetup' })}
        />
        <GameCard
          title="不要做挑戰"
          subtitle="Forbidden Challenge"
          icon={<Ban size={24} />}
          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'forbiddenSetup' })}
        />
      </div>

      <Button 
        variant="secondary" 
        className="mt-4 bg-[#FECF06] !text-black hover:!bg-yellow-400"
        onClick={() => dispatch({ type: 'NAVIGATE', payload: 'customManager' })}
      >
        <Settings size={18} />
        管理自訂題目
      </Button>
    </div>
  );
};