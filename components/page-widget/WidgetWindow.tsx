import React from 'react';
import { PageWidgetConfig, WordTab, WordCategory, WordEntry } from '../../types';
import { X, Settings2, CheckSquare, Square, GripVertical, Download, ExternalLink, PlayCircle, Filter, Star, BarChart2 } from 'lucide-react';
import { playWordAudio } from '../../utils/audio';

interface WidgetWindowProps {
    config: PageWidgetConfig;
    filteredWords: WordEntry[];
    availableTabs: WordTab[];
    activeTab: WordTab;
    setActiveTab: (tab: WordTab) => void;
    selectedWordIds: Set<string>;
    toggleSelectAll: () => void;
    toggleSelectWord: (id: string) => void;
    handleBatchSetToLearning: () => void;
    handleBatchDismiss: () => void;
    onClose: () => void;
    onMouseDownHeader: (e: React.MouseEvent) => void;
    onMouseDownResize: (e: React.MouseEvent) => void;
    isConfigOpen: boolean;
    setIsConfigOpen: (v: boolean) => void;
    updateSetting: (updater: (prev: PageWidgetConfig) => PageWidgetConfig) => void;
    handleConfigDragStart: (idx: number) => void;
    handleConfigDragOver: (e: React.DragEvent, idx: number) => void;
    handleConfigDragEnd: () => void;
    draggedConfigIndex: number | null;
    onOpenDetail?: (word: string) => void;
}

export const WidgetWindow: React.FC<WidgetWindowProps> = ({
    config, filteredWords, availableTabs, activeTab, setActiveTab,
    selectedWordIds, toggleSelectAll, toggleSelectWord, handleBatchSetToLearning, handleBatchDismiss,
    onClose, onMouseDownHeader, onMouseDownResize,
    isConfigOpen, setIsConfigOpen, updateSetting,
    handleConfigDragStart, handleConfigDragOver, handleConfigDragEnd, draggedConfigIndex,
    onOpenDetail
}) => {
    
    const getTabLabel = (tab: WordTab) => {
        if (tab === 'all') return '所有词汇';
        if (tab === WordCategory.WantToLearnWord) return '想学习';
        if (tab === WordCategory.LearningWord) return '正在学';
        if (tab === WordCategory.KnownWord) return '已掌握';
        return tab;
    };

    const isAllSelected = filteredWords.length > 0 && filteredWords.every(w => selectedWordIds.has(w.id));

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(filteredWords, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contextlingo_export_${activeTab}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div 
            className="fixed z-[2147483647] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 ring-1 ring-black/5 font-sans"
            style={{ 
               left: config.modalPosition.x, 
               top: config.modalPosition.y,
               width: config.modalSize.width, 
               height: config.modalSize.height,
               maxWidth: '90vw',
               maxHeight: '90vh',
               boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.3)'
            }}
         >
            {/* Header */}
            <div 
                className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 cursor-grab active:cursor-grabbing select-none shrink-0"
                onMouseDown={onMouseDownHeader}
            >
               <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight m-0">当前页面词汇</h2>
               </div>
               <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setIsConfigOpen(!isConfigOpen)} 
                    className={`p-2 rounded-lg transition-colors ${isConfigOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                    title="卡片显示配置"
                  >
                     <Settings2 className="w-5 h-5" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Config Panel */}
            {isConfigOpen && (
               <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 space-y-5">
                   <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800">卡片显示配置</h3>
                        <button onClick={() => setIsConfigOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">收起</button>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">固定内容</span>
                            <div className="space-y-2">
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showPhonetic} onChange={() => updateSetting(p => ({...p, showPhonetic: !p.showPhonetic}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示音标</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showMeaning} onChange={() => updateSetting(p => ({...p, showMeaning: !p.showMeaning}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示释义</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showPartOfSpeech} onChange={() => updateSetting(p => ({...p, showPartOfSpeech: !p.showPartOfSpeech}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示词性</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showTags} onChange={() => updateSetting(p => ({...p, showTags: !p.showTags}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示等级标签</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showImportance} onChange={() => updateSetting(p => ({...p, showImportance: !p.showImportance}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示星级</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showCocaRank} onChange={() => updateSetting(p => ({...p, showCocaRank: !p.showCocaRank}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示 COCA</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showExampleTranslation} onChange={() => updateSetting(p => ({...p, showExampleTranslation: !p.showExampleTranslation}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示例句翻译</span>
                                </label>
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={config.showContextTranslation} onChange={() => updateSetting(p => ({...p, showContextTranslation: !p.showContextTranslation}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700">显示原句翻译</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">例句逻辑与排序</span>
                            <div className="space-y-3">
                                <label className="flex items-center cursor-pointer select-none mb-3">
                                    <input type="checkbox" checked={config.showMultiExamples} onChange={() => updateSetting(p => ({...p, showMultiExamples: !p.showMultiExamples}))} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" /> 
                                    <span className="ml-2 text-sm text-slate-700 font-medium">显示所有例句 (不折叠)</span>
                                </label>
                                <div className="space-y-2">
                                    {config.cardDisplay.map((item, index) => (
                                        <div key={item.id} draggable onDragStart={() => handleConfigDragStart(index)} onDragOver={(e) => handleConfigDragOver(e, index)} onDragEnd={handleConfigDragEnd} className={`flex items-center p-2 bg-white border rounded-lg cursor-move hover:border-blue-400 transition ${draggedConfigIndex === index ? 'opacity-50 border-blue-400 border-dashed' : 'border-slate-200 shadow-sm'}`}>
                                            <GripVertical className="w-4 h-4 text-slate-400 mr-2" />
                                            <span className="text-xs text-slate-700 flex-1">{item.label}</span>
                                            <input type="checkbox" checked={item.enabled} onChange={() => { updateSetting(p => { const newDisplay = [...p.cardDisplay]; newDisplay[index].enabled = !newDisplay[index].enabled; return {...p, cardDisplay: newDisplay}; }); }} className="rounded text-blue-600 border-slate-300" /> 
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
            )}
            
            {/* Tabs & Actions */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col gap-3 shrink-0">
               <div className="flex gap-2">
                  {availableTabs.map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{getTabLabel(tab)}</button>
                  ))}
               </div>
               <div className="flex items-center justify-between pt-1">
                   <button onClick={toggleSelectAll} className="flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                      {isAllSelected ? <CheckSquare className="w-4 h-4 mr-1.5 text-blue-600"/> : <Square className="w-4 h-4 mr-1.5 text-slate-400"/>}
                      全选 ({filteredWords.length})
                   </button>
                   <div className="flex items-center gap-2">
                        {selectedWordIds.size > 0 && (
                            <button onClick={handleBatchSetToLearning} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100 text-xs font-medium transition animate-in slide-in-from-right-2 fade-in">
                                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg> 添加到正在学
                            </button>
                        )}
                        <button onClick={handleExport} className="flex items-center px-3 py-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-50 border border-slate-200 text-xs transition" title="导出当前列表">
                            <Download className="w-3.5 h-3.5 mr-1.5" /> 导出
                        </button>
                   </div>
               </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 custom-scrollbar">
               {filteredWords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                     <Filter className="w-12 h-12 mb-3 opacity-20" />
                     <span className="text-sm">当前列表暂无词汇</span>
                  </div>
               ) : (
                 filteredWords.map(word => (
                     <div key={word.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all relative group ${selectedWordIds.has(word.id) ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}>
                        <div className="flex gap-4">
                           <div className="pt-1">
                              <div onClick={() => toggleSelectWord(word.id)} className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${selectedWordIds.has(word.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
                                 {selectedWordIds.has(word.id) && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                           </div>
                           <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* 单词标题：点击跳转详情，确保样式和交互在 Shadow DOM 生效 */}
                                            <h3 
                                                className="font-bold text-xl text-slate-800 m-0 cursor-pointer hover:text-blue-600 hover:underline decoration-blue-200 transition-all select-none pointer-events-auto z-10"
                                                style={{ display: 'inline-block' }}
                                                onClick={(e) => { 
                                                    e.preventDefault();
                                                    e.stopPropagation(); 
                                                    onOpenDetail?.(word.text); 
                                                }}
                                                title="在新标签页查看详细信息"
                                            >
                                                {word.text}
                                            </h3>
                                            {config.showPartOfSpeech && word.partOfSpeech && (
                                                <span className="font-serif font-bold text-xs text-slate-400 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-100">{word.partOfSpeech}</span>
                                            )}
                                            {config.showPhonetic && (word.phoneticUs || word.phoneticUk) && (
                                                <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                                    {word.phoneticUs && (
                                                        <span className="flex items-center cursor-pointer hover:text-blue-600 transition select-none mr-2" onClick={(e) => { e.stopPropagation(); playWordAudio(word.text, 'US'); }}>
                                                            <span className="text-[10px] text-slate-400 mr-1 font-sans">US</span> {word.phoneticUs} <PlayCircle className="w-3 h-3 ml-1.5 opacity-50 hover:opacity-100"/>
                                                        </span>
                                                    )}
                                                    {word.phoneticUk && (
                                                        <span className="flex items-center cursor-pointer hover:text-blue-600 transition select-none" onClick={(e) => { e.stopPropagation(); playWordAudio(word.text, 'UK'); }}>
                                                            <span className="text-[10px] text-slate-400 mr-1 font-sans">UK</span> {word.phoneticUk} <PlayCircle className="w-3 h-3 ml-1.5 opacity-50 hover:opacity-100"/>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {config.showMeaning && (
                                            <div className="text-sm text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-medium self-start">
                                                {word.translation}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 min-w-[60px]">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border whitespace-nowrap ${word.category === WordCategory.KnownWord ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : word.category === WordCategory.LearningWord ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {word.category === WordCategory.KnownWord ? '已掌握' : word.category === WordCategory.LearningWord ? '正在学' : '想学习'}
                                        </span>
                                        {config.showTags && word.tags && word.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {word.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">{tag}</span>
                                                ))}
                                                {word.tags.length > 2 && <span className="text-[10px] text-slate-400">+{word.tags.length - 2}</span>}
                                            </div>
                                        )}
                                        <div className="flex gap-2 text-[10px] text-slate-400">
                                            {config.showImportance && word.importance ? (
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-2.5 h-2.5 ${i < (word.importance || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            ) : null}
                                            {config.showCocaRank && word.cocaRank && word.cocaRank > 0 ? (
                                                <span className="flex items-center">
                                                    <BarChart2 className="w-2.5 h-2.5 mr-0.5"/> #{word.cocaRank}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    {config.cardDisplay.map(item => {
                                        if(!item.enabled) return null;
                                        if(item.id === 'context' && word.contextSentence) return (
                                            <div key="ctx" className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group/line">
                                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-3 select-none">来源原句 (Context)</span>
                                                <p className="text-sm text-slate-700 leading-relaxed pl-3 font-medium">{word.contextSentence}</p>
                                                {config.showContextTranslation && word.contextSentenceTranslation && (
                                                    <p className="text-xs text-slate-500 pl-3 mt-1">{word.contextSentenceTranslation}</p>
                                                )}
                                                <div className="mt-1 pl-3 text-[10px] text-blue-500 flex items-center opacity-0 group-hover/line:opacity-100 transition-opacity">
                                                     <ExternalLink className="w-3 h-3 mr-1" /> 点击跳转到来源
                                                </div>
                                            </div>
                                        )
                                        if(item.id === 'mixed' && word.mixedSentence) return (
                                             <div key="mix" className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative">
                                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-purple-500 rounded-r"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-3 select-none">中英混合 (Mixed)</span>
                                                <p className="text-sm text-slate-700 leading-relaxed pl-3">{word.mixedSentence}</p>
                                            </div>
                                        )
                                        if(item.id === 'dictExample' && word.dictionaryExample) return (
                                            <div key="dict" className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative">
                                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-3 select-none">词典例句 (Dictionary)</span>
                                                <p className="text-sm text-slate-600 italic leading-relaxed pl-3">{word.dictionaryExample}</p>
                                                {config.showExampleTranslation && word.dictionaryExampleTranslation && (
                                                    <p className="text-xs text-slate-500 pl-3 mt-1">{word.dictionaryExampleTranslation}</p>
                                                )}
                                            </div>
                                        )
                                        return null;
                                    })}
                                </div>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
            
            {/* Resize Handle */}
            <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors z-50 rounded-tl-lg hover:bg-slate-50" onMouseDown={onMouseDownResize}>
               <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v6" /><path d="M15 21h6" /><path d="M21 21l-9-9" /></svg>
            </div>
         </div>
    );
};