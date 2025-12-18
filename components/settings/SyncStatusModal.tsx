
import React, { useState, useMemo } from 'react';
import { WordEntry, WordCategory, MergeStrategyConfig, WordTab } from '../../types';
import { WordList } from '../word-manager/WordList';
import { MergeConfigModal } from '../word-manager/MergeConfigModal';
import { DEFAULT_MERGE_STRATEGY } from '../../constants';
import { X, CheckCircle, Download, CheckSquare, Square, Settings2, Search, GraduationCap, List } from 'lucide-react';
import { Toast, ToastMessage } from '../ui/Toast';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: WordEntry[]; // 从 Anki 获取到的符合条件的单词
  onConfirm: (selectedIds: string[]) => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose, candidates, onConfirm }) => {
  // 默认定位在“正在学”
  const [activeTab, setActiveTab] = useState<WordTab>(WordCategory.LearningWord);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // 独立的显示配置
  const [showConfig, setShowConfig] = useState({
    showPhonetic: true,
    showMeaning: true,
  });
  const [mergeConfig, setMergeConfig] = useState<MergeStrategyConfig>(DEFAULT_MERGE_STRATEGY);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // 默认全选所有候选词（跨页签的全选概念，初始状态全选）
  React.useEffect(() => {
      if (isOpen && candidates.length > 0) {
          setSelectedWords(new Set(candidates.map(c => c.id)));
      }
  }, [isOpen, candidates]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  // 过滤逻辑 (Hooks must be called unconditionally)
  const filteredEntries = useMemo(() => {
    return candidates.filter(e => {
      // Tab Filtering
      if (activeTab !== 'all') {
          if (e.category !== activeTab) return false;
      }

      // Search Filtering
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchText = e.text.toLowerCase().includes(lowerQ);
        const matchTrans = e.translation?.includes(lowerQ) || false;
        if (!matchText && !matchTrans) return false;
      }
      return true;
    });
  }, [candidates, activeTab, searchQuery]);

  // 分组逻辑 (Hooks must be called unconditionally)
  const groupedEntries = useMemo(() => {
    const groups: Record<string, WordEntry[]> = {};
    filteredEntries.forEach(entry => {
      let key = entry.text.toLowerCase().trim();
      if (mergeConfig.strategy === 'by_word_and_meaning') {
        key = `${key}::${entry.translation?.trim()}`;
      }
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    const sortedGroups = Object.values(groups).map(group => {
       return group.sort((a, b) => b.addedAt - a.addedAt);
    });
    return sortedGroups.sort((a, b) => {
       const maxA = a[0].addedAt; 
       const maxB = b[0].addedAt;
       return maxB - maxA;
    });
  }, [filteredEntries, mergeConfig.strategy]);

  // Derived variables (not hooks)
  const allVisibleIds = filteredEntries.map(e => e.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedWords.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const newSet = new Set(selectedWords);
      allVisibleIds.forEach(id => newSet.delete(id));
      setSelectedWords(newSet);
    } else {
      const newSet = new Set(selectedWords);
      allVisibleIds.forEach(id => newSet.add(id));
      setSelectedWords(newSet);
    }
  };

  const toggleSelectGroup = (group: WordEntry[]) => {
    const newSet = new Set(selectedWords);
    const groupIds = group.map(g => g.id);
    const isGroupSelected = groupIds.every(id => newSet.has(id));

    if (isGroupSelected) {
      groupIds.forEach(id => newSet.delete(id));
    } else {
      groupIds.forEach(id => newSet.add(id));
    }
    setSelectedWords(newSet);
  };

  const isGroupSelected = (group: WordEntry[]) => {
    return group.every(e => selectedWords.has(e.id));
  };

  const handleExport = () => {
     const dataToExport = candidates.filter(e => selectedWords.has(e.id));
     if (dataToExport.length === 0) {
        showToast('请至少选择一个单词', 'warning');
        return;
     }
     const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `contextlingo_anki_sync_${dataToExport.length}words_${Date.now()}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     showToast(`成功导出 ${dataToExport.length} 个单词`, 'success');
  };

  const handleConfirm = () => {
      if (selectedWords.size === 0) {
          showToast('请至少选择一个单词进行同步', 'warning');
          return;
      }
      onConfirm(Array.from(selectedWords));
  };

  const getTabLabel = (tab: WordTab) => tab === 'all' ? '所有待同步' : tab;

  // Drag handlers for config
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newOrder = [...mergeConfig.exampleOrder];
    const draggedItem = newOrder[draggedItemIndex];
    newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setMergeConfig({ ...mergeConfig, exampleOrder: newOrder });
    setDraggedItemIndex(index);
  };
  const handleDragEnd = () => setDraggedItemIndex(null);

  // Early Return - Moved AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            <Toast toast={toast} onClose={() => setToast(null)} />

            <MergeConfigModal 
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                mergeConfig={mergeConfig}
                setMergeConfig={setMergeConfig}
                showConfig={showConfig}
                setShowConfig={setShowConfig}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragEnd={handleDragEnd}
                draggedItemIndex={draggedItemIndex}
            />

            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2 text-green-600"/>
                        Anki 进度同步确认
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        以下单词在 Anki 中已达到掌握标准，勾选以将其状态更新为“已掌握”。
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMergeModalOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition"
                        title="显示配置"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-slate-200 bg-white p-4 space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 pb-2 border-b border-slate-100 overflow-x-auto hide-scrollbar">
                    {/* 我们只展示'想学'和'正在学'，以及'All'，因为'已掌握'通常是同步的目标而非来源 */}
                    {(['all', WordCategory.WantToLearnWord, WordCategory.LearningWord] as WordTab[]).map((tab) => {
                        const count = tab === 'all' 
                            ? candidates.length 
                            : candidates.filter(c => c.category === tab).length;
                        
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all flex items-center ${
                                    activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {tab === 'all' && <List className="w-3.5 h-3.5 mr-2" />}
                                {getTabLabel(tab)} 
                                <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={toggleSelectAll} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 select-none">
                            {allSelected ? <CheckSquare className="w-5 h-5 mr-2 text-blue-600"/> : <Square className="w-5 h-5 mr-2 text-slate-400"/>}
                            全选
                        </button>
                        
                        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 flex-1 max-w-xs">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="在结果中搜索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm border-none bg-transparent focus:ring-0 text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <button onClick={handleExport} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                            <Download className="w-4 h-4 mr-2" /> 导出
                        </button>
                        <button 
                            onClick={handleConfirm} 
                            disabled={selectedWords.size === 0}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> 设为已掌握 ({selectedWords.size})
                        </button>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="bg-slate-50 p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <WordList 
                    groupedEntries={groupedEntries}
                    selectedWords={selectedWords}
                    toggleSelectGroup={toggleSelectGroup}
                    isGroupSelected={isGroupSelected}
                    showConfig={showConfig}
                    mergeConfig={mergeConfig}
                    isAllWordsTab={activeTab === 'all'}
                    searchQuery={searchQuery}
                />
            </div>
        </div>
    </div>
  );
};
