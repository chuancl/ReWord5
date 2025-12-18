



import React from 'react';
import { MergeStrategyConfig } from '../../types';
import { Settings2, X, GripVertical } from 'lucide-react';

interface MergeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mergeConfig: MergeStrategyConfig;
  setMergeConfig: React.Dispatch<React.SetStateAction<MergeStrategyConfig>>;
  showConfig: { showPhonetic: boolean; showMeaning: boolean; };
  setShowConfig: React.Dispatch<React.SetStateAction<{ showPhonetic: boolean; showMeaning: boolean; }>>;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  draggedItemIndex: number | null;
}

export const MergeConfigModal: React.FC<MergeConfigModalProps> = ({ 
    isOpen, onClose, mergeConfig, setMergeConfig, showConfig, setShowConfig,
    handleDragStart, handleDragOver, handleDragEnd, draggedItemIndex
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center"><Settings2 className="w-5 h-5 mr-2 text-blue-600"/> 策略与显示配置</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-500"/></button>
        </div>
        <div className="p-8 overflow-y-auto space-y-8">
            
            {/* 1. Merge Rules */}
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                多网页重复单词合并规则
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${mergeConfig.strategy === 'by_word' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                    <input type="radio" name="merge_strategy" checked={mergeConfig.strategy === 'by_word'} onChange={() => setMergeConfig({...mergeConfig, strategy: 'by_word'})} className="mt-1 text-blue-600" />
                    <div className="ml-3">
                        <div className="text-sm font-bold text-slate-900">仅按单词拼写合并</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">不同语境下的 "bank" (银行/河岸) 将合并为同一张卡片，例句累加。</p>
                    </div>
                </label>
                <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition ${mergeConfig.strategy === 'by_word_and_meaning' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                    <input type="radio" name="merge_strategy" checked={mergeConfig.strategy === 'by_word_and_meaning'} onChange={() => setMergeConfig({...mergeConfig, strategy: 'by_word_and_meaning'})} className="mt-1 text-blue-600" />
                    <div className="ml-3">
                        <div className="text-sm font-bold text-slate-900">按单词 + 释义合并</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">"bank (银行)" 和 "bank (河岸)" 将视为两个不同单词，分开显示。</p>
                    </div>
                </label>
                </div>
            </div>

            {/* 2. Card Content Toggles */}
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                    卡片内容开关
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={showConfig.showPhonetic} onChange={e => setShowConfig({...showConfig, showPhonetic: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">音标</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={showConfig.showMeaning} onChange={e => setShowConfig({...showConfig, showMeaning: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">中文释义</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showExampleTranslation} onChange={e => setMergeConfig({...mergeConfig, showExampleTranslation: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">例句翻译</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showContextTranslation} onChange={e => setMergeConfig({...mergeConfig, showContextTranslation: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">原句翻译</span>
                    </label>

                    {/* New Fields */}
                     <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showPartOfSpeech} onChange={e => setMergeConfig({...mergeConfig, showPartOfSpeech: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">词性</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showTags} onChange={e => setMergeConfig({...mergeConfig, showTags: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">词汇等级</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showImportance} onChange={e => setMergeConfig({...mergeConfig, showImportance: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">柯林斯星级</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showCocaRank} onChange={e => setMergeConfig({...mergeConfig, showCocaRank: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">COCA排名</span>
                    </label>
                     <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showImage} onChange={e => setMergeConfig({...mergeConfig, showImage: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">单词图片</span>
                    </label>
                     <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox" checked={mergeConfig.showVideo} onChange={e => setMergeConfig({...mergeConfig, showVideo: e.target.checked})} className="rounded text-blue-600 w-4 h-4 mr-3"/>
                        <span className="text-sm font-medium text-slate-700">视频讲解</span>
                    </label>
                </div>
            </div>

            {/* 3. Example Logic */}
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                    例句与附加信息排序
                </h4>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <div>
                    <span className="text-sm font-bold text-slate-800 block">显示所有遇到的例句</span>
                    <span className="text-xs text-slate-500">若关闭，则仅显示最近一次（最新）遇到的例句。</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={mergeConfig.showMultiExamples} onChange={e => setMergeConfig({...mergeConfig, showMultiExamples: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-slate-400 mb-2">显示顺序与显隐 (拖拽调整)</p>
                    {mergeConfig.exampleOrder.map((item, index) => (
                        <div key={item.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`flex items-center p-3 bg-white border rounded-lg shadow-sm cursor-move ${draggedItemIndex === index ? 'opacity-50 border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                            <GripVertical className="w-4 h-4 text-slate-400 mr-3" />
                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                            <input type="checkbox" checked={item.enabled} onChange={() => {const newOrder = [...mergeConfig.exampleOrder]; newOrder[index].enabled = !newOrder[index].enabled; setMergeConfig({...mergeConfig, exampleOrder: newOrder});}} className="ml-auto rounded text-blue-600"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">保存配置</button>
        </div>
        </div>
    </div>
  );
};