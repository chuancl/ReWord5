
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WordCategory, WordEntry, MergeStrategyConfig, WordTab, Scenario, AppView } from '../types';
import { DEFAULT_MERGE_STRATEGY } from '../constants';
import { Upload, Download, Filter, Settings2, List, Search, Plus, Trash2, CheckSquare, Square, ArrowRight, BookOpen, GraduationCap, CheckCircle, RotateCcw, FileDown, Sparkles } from 'lucide-react';
import { MergeConfigModal } from './word-manager/MergeConfigModal';
import { AddWordModal } from './word-manager/AddWordModal';
import { WordList } from './word-manager/WordList';
import { Toast, ToastMessage } from './ui/Toast';
import { entriesStorage } from '../utils/storage';
import { COCA_TOP_100 } from '../utils/coca-data';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-pre-line text-center shadow-xl leading-relaxed min-w-[120px]">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

// --- Standard Import Template (Comprehensive) ---
const IMPORT_TEMPLATE = [
  {
    "text": "serendipity",
    "translation": "机缘凑巧; 意外发现珍奇事物的本领",
    "phoneticUs": "/ˌsɛrənˈdɪpɪti/",
    "phoneticUk": "/ˌsɛrənˈdɪpɪti/",
    "partOfSpeech": "n.",
    "englishDefinition": "The occurrence and development of events by chance in a happy or beneficial way.",
    "dictionaryExample": "Nature has created wonderful things by serendipity.",
    "dictionaryExampleTranslation": "大自然通过机缘巧合创造了奇妙的事物。",
    "inflections": ["serendipities"],
    "tags": ["CET6", "GRE", "Literary"],
    "importance": 3,
    "cocaRank": 15000,
    "phrases": [
      { "text": "pure serendipity", "trans": "纯属巧合" }
    ],
    "roots": [
      { "root": "serendip", "words": [{ "text": "serendipitous", "trans": "偶然的" }] }
    ],
    "synonyms": [
      { "text": "chance", "trans": "机会" },
      { "text": "fluke", "trans": "侥幸" }
    ]
  }
];

interface WordManagerProps {
  scenarios: Scenario[];
  entries: WordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<WordEntry[]>>;
  ttsSpeed?: number;
  initialTab?: WordTab;
  initialSearchQuery?: string;
  onOpenDetail?: (word: string) => void;
}

export const WordManager: React.FC<WordManagerProps> = ({ 
    scenarios, 
    entries, 
    setEntries, 
    ttsSpeed = 1.0,
    initialTab,
    initialSearchQuery,
    onOpenDetail
}) => {
  const [activeTab, setActiveTab] = useState<WordTab>('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  // Modal States
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Configs
  const [showConfig, setShowConfig] = useState({ showPhonetic: true, showMeaning: true });
  const [mergeConfig, setMergeConfig] = useState<MergeStrategyConfig>(DEFAULT_MERGE_STRATEGY);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  useEffect(() => {
     const savedConfigStr = localStorage.getItem('context-lingo-merge-config');
     if (savedConfigStr) {
         try {
             const saved = JSON.parse(savedConfigStr);
             setMergeConfig(saved);
         } catch (e) {
             setMergeConfig(DEFAULT_MERGE_STRATEGY);
         }
     }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  const handleImportPreset = async () => {
    const targetCategory = activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab;
    let addedCount = 0;
    
    const newEntriesToAdd: WordEntry[] = [];
    const scenarioId = selectedScenarioId === 'all' ? '1' : selectedScenarioId;

    COCA_TOP_100.forEach(item => {
        const isDuplicate = entries.some(e => e.text.toLowerCase() === item.text?.toLowerCase());
        if (!isDuplicate) {
            newEntriesToAdd.push({
                ...item,
                id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                category: targetCategory,
                addedAt: Date.now(),
                scenarioId,
                text: item.text!,
                inflections: item.inflections || [],
                tags: item.tags || [],
                phrases: item.phrases || [],
                roots: item.roots || [],
                synonyms: item.synonyms || []
            } as WordEntry);
            addedCount++;
        }
    });

    if (newEntriesToAdd.length > 0) {
        setEntries(prev => [...prev, ...newEntriesToAdd]);
        showToast(`成功导入 ${addedCount} 个 COCA 高频词汇至 "${targetCategory}"`, 'success');
    } else {
        showToast('词库中已包含这些高频词汇', 'info');
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (activeTab !== 'all' && e.category !== activeTab) return false;
      if (selectedScenarioId !== 'all' && e.scenarioId !== selectedScenarioId) return false;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        return e.text.toLowerCase().includes(lowerQ) || e.translation?.toLowerCase().includes(lowerQ);
      }
      return true; 
    });
  }, [entries, activeTab, selectedScenarioId, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, WordEntry[]> = {};
    filteredEntries.forEach(entry => {
      let key = entry.text.toLowerCase().trim();
      if (mergeConfig.strategy === 'by_word_and_meaning') key = `${key}::${entry.translation?.trim()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return Object.values(groups).map(g => g.sort((a, b) => b.addedAt - a.addedAt)).sort((a, b) => b[0].addedAt - a[0].addedAt);
  }, [filteredEntries, mergeConfig.strategy]);

  const allVisibleIds = useMemo(() => filteredEntries.map(e => e.id), [filteredEntries]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedWords.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const newSet = new Set(selectedWords);
      allVisibleIds.forEach(id => newSet.delete(id));
      setSelectedWords(newSet);
    } else {
      setSelectedWords(new Set([...selectedWords, ...allVisibleIds]));
    }
  };

  // --- Added toggleSelectGroup and isGroupSelected helper functions ---
  const toggleSelectGroup = (group: WordEntry[]) => {
    const newSet = new Set(selectedWords);
    const groupIds = group.map(g => g.id);
    const isGroupSel = groupIds.every(id => newSet.has(id));

    if (isGroupSel) {
      groupIds.forEach(id => newSet.delete(id));
    } else {
      groupIds.forEach(id => newSet.add(id));
    }
    setSelectedWords(newSet);
  };

  const isGroupSelected = (group: WordEntry[]) => {
    return group.every(e => selectedWords.has(e.id));
  };

  const handleDeleteSelected = () => {
    if (selectedWords.size === 0) return;
    if (confirm(`确定删除选中的 ${selectedWords.size} 个单词吗？`)) {
      setEntries(prev => prev.filter(e => !selectedWords.has(e.id)));
      setSelectedWords(new Set());
      showToast('删除成功', 'success');
    }
  };

  const handleBatchMove = (targetCategory: WordCategory) => {
      if (selectedWords.size === 0) return;
      setEntries(prev => prev.map(e => selectedWords.has(e.id) ? { ...e, category: targetCategory } : e));
      setSelectedWords(new Set());
      showToast('移动成功', 'success');
  };

  const handleExport = () => {
     const dataToExport = selectedWords.size > 0 ? entries.filter(e => selectedWords.has(e.id)) : filteredEntries;
     if (dataToExport.length === 0) return showToast('列表为空', 'warning');
     const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `contextlingo_export_${Date.now()}.json`;
     a.click();
     showToast(`导出成功`, 'success');
  };

  const handleAddWord = async (entryData: Partial<WordEntry>) => {
      const isDuplicate = entries.some(e => e.text.toLowerCase() === entryData.text?.toLowerCase() && e.translation?.trim() === entryData.translation?.trim());
      if (isDuplicate) return showToast(`"${entryData.text}" 已存在`, 'warning');
      const targetCategory = entryData.category || (activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab);
      const newEntry: WordEntry = {
          ...entryData,
          id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          text: entryData.text!,
          category: targetCategory,
          addedAt: Date.now(),
          scenarioId: selectedScenarioId === 'all' ? '1' : selectedScenarioId,
      } as WordEntry;
      setEntries(prev => [newEntry, ...prev]);
      showToast('添加成功', 'success');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative min-h-[600px]">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {}} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="border-b border-slate-200 px-6 py-5 bg-slate-50 rounded-t-xl flex justify-between items-center flex-wrap gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">词汇库管理</h2>
           <p className="text-sm text-slate-500 mt-1">管理、筛选及编辑您的个性化词库</p>
        </div>
        <div className="flex gap-2">
           <Tooltip text="导入常用的 300 个 COCA 高频单词（包含完整解析）">
              <button 
                onClick={handleImportPreset}
                className="flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200 animate-pulse-slow"
              >
                <Sparkles className="w-4 h-4 mr-2" /> 导入预设 (COCA 300)
              </button>
           </Tooltip>
           <button onClick={() => setIsMergeModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <Settings2 className="w-4 h-4 mr-2" /> 显示配置
           </button>
        </div>
      </div>
      
      <AddWordModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddWord} initialCategory={activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab} />
      <MergeConfigModal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} mergeConfig={mergeConfig} setMergeConfig={setMergeConfig} showConfig={showConfig} setShowConfig={setShowConfig} handleDragStart={() => {}} handleDragOver={() => {}} handleDragEnd={() => {}} draggedItemIndex={null} />

      <div className="border-b border-slate-200 bg-white p-4 space-y-4">
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {(['all', ...Object.values(WordCategory)] as WordTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
              {tab === 'all' && <List className="w-4 h-4 mr-2" />} {tab === 'all' ? '所有单词' : tab}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
           <div className="flex items-center gap-4 flex-1">
              <button onClick={toggleSelectAll} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 select-none">
                {allSelected ? <CheckSquare className="w-5 h-5 mr-2 text-blue-600"/> : <Square className="w-5 h-5 mr-2 text-slate-400"/>} 全选
              </button>
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 flex-1 max-w-xs">
                 <Search className="w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="搜索单词..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-sm border-none bg-transparent focus:ring-0 text-slate-700 placeholder:text-slate-400" />
              </div>
           </div>

           <div className="flex gap-2 items-center">
              {selectedWords.size > 0 ? (
                 <>
                    <button onClick={() => handleBatchMove(WordCategory.LearningWord)} className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"><BookOpen className="w-4 h-4 mr-2" /> 移至正在学</button>
                    <button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"><Download className="w-4 h-4 mr-2" /> 导出</button>
                    <button onClick={handleDeleteSelected} className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition"><Trash2 className="w-4 h-4 mr-2" /> 删除</button>
                 </>
              ) : (
                  <>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition"><Plus className="w-4 h-4 mr-2" /> 手动添加</button>
                    <button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"><Download className="w-4 h-4 mr-2" /> 导出全部</button>
                  </>
              )}
           </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 space-y-4 flex-1">
        <WordList groupedEntries={groupedEntries} selectedWords={selectedWords} toggleSelectGroup={(g) => toggleSelectGroup(g)} isGroupSelected={(g) => isGroupSelected(g)} showConfig={showConfig} mergeConfig={mergeConfig} isAllWordsTab={activeTab === 'all'} searchQuery={searchQuery} ttsSpeed={ttsSpeed} onOpenDetail={onOpenDetail} />
      </div>
    </div>
  );
};
