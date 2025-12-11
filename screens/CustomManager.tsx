import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Button, ScreenLayout } from '../components/UI';
import { BIG_TV_CATEGORIES, WORD_CHAIN_TOPICS } from '../constants';
import { Trash2, Plus } from 'lucide-react';

type Tab = 'bigTV' | 'bombQuestion' | 'wordChain' | 'forbidden';

export const CustomManager: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<Tab>('bigTV');
  const [subCat, setSubCat] = useState<string>(''); // For BigTV categories or WordChain topics
  const [inputText, setInputText] = useState('');
  
  // Determine subcategories if applicable
  const getSubOptions = () => {
    if (activeTab === 'bigTV') return BIG_TV_CATEGORIES.map(c => ({ id: c.id, name: c.nameZh }));
    if (activeTab === 'wordChain') return WORD_CHAIN_TOPICS.map(t => ({ id: t.id, name: t.name }));
    return [];
  };

  const subOptions = getSubOptions();
  
  // Set default subcat
  useEffect(() => {
    if (subOptions.length > 0 && !subCat) {
      setSubCat(subOptions[0].id);
    }
  }, [activeTab, subOptions, subCat]);

  const handleAdd = () => {
    if (!inputText.trim()) return;
    const newId = `c_${Date.now()}`;
    
    dispatch({
      type: 'ADD_CUSTOM_QUESTION',
      payload: {
        game: activeTab,
        categoryId: (activeTab === 'bigTV' || activeTab === 'wordChain') ? subCat : undefined,
        question: { id: newId, text: inputText }
      }
    });
    setInputText('');
  };

  const getList = () => {
    if (activeTab === 'bigTV') return state.customQuestions.bigTV[subCat] || [];
    if (activeTab === 'bombQuestion') return state.customQuestions.bombQuestion;
    if (activeTab === 'wordChain') return state.customQuestions.wordChain[subCat] || [];
    if (activeTab === 'forbidden') return state.customQuestions.forbidden;
    return [];
  };

  const currentList = getList();

  return (
    <ScreenLayout title="自訂題目管理" onBack={() => dispatch({ type: 'NAVIGATE', payload: 'home' })}>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {['bigTV', 'bombQuestion', 'wordChain', 'forbidden'].map(tab => (
           <button
             key={tab}
             onClick={() => { setActiveTab(tab as Tab); setSubCat(''); }}
             className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${activeTab === tab ? 'bg-primary text-black' : 'bg-black/20 text-text-sub'}`}
           >
             {tab === 'bigTV' ? '大電視' : tab === 'bombQuestion' ? '答問題' : tab === 'wordChain' ? '撞機' : '不要做'}
           </button>
        ))}
      </div>

      {subOptions.length > 0 && (
        <div className="mb-4">
           <label className="text-xs text-text-sub mb-1 block">類別 / 主題</label>
           <select 
             className="w-full bg-black/20 text-white p-3 rounded-xl outline-none"
             value={subCat}
             onChange={(e) => setSubCat(e.target.value)}
           >
             {subOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
           </select>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="輸入題目..."
          className="flex-1 bg-black/20 border border-gray-700 rounded-xl px-4 text-white focus:border-primary outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!inputText.trim()}><Plus size={20} /></Button>
      </div>

      <div className="space-y-2 mb-8">
        {currentList.length === 0 && <div className="text-center text-text-sub py-8">暫無自訂題目</div>}
        {currentList.map(item => (
          <div key={item.id} className="bg-black/20 p-3 rounded-xl flex items-center justify-between">
            <span className="text-white font-medium">{item.text}</span>
            <button 
              onClick={() => dispatch({ 
                type: 'DELETE_CUSTOM_QUESTION', 
                payload: { game: activeTab, categoryId: (activeTab === 'bigTV' || activeTab === 'wordChain') ? subCat : undefined, id: item.id } 
              })}
              className="text-red-400 p-2 hover:bg-white/5 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </ScreenLayout>
  );
};