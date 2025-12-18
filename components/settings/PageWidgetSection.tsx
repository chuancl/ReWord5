



import React, { useState } from 'react';
import { PageWidgetConfig, WordCategory } from '../../types';
import { GripVertical, PlayCircle, BarChart2, Star } from 'lucide-react';

export interface PageWidgetSectionProps {
  widget: PageWidgetConfig;
  setWidget: React.Dispatch<React.SetStateAction<PageWidgetConfig>>;
}

export const PageWidgetSection: React.FC<PageWidgetSectionProps> = ({ widget, setWidget }) => {
   const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

   const handleDragStart = (index: number) => setDraggedItemIndex(index);
   const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedItemIndex === null || draggedItemIndex === index) return;
      const newOrder = [...widget.cardDisplay];
      const draggedItem = newOrder[draggedItemIndex];
      newOrder.splice(draggedItemIndex, 1);
      newOrder.splice(index, 0, draggedItem);
      setWidget({ ...widget, cardDisplay: newOrder });
      setDraggedItemIndex(index);
   };
   const handleDragEnd = () => setDraggedItemIndex(null);

   const toggleItem = (index: number) => {
      const newOrder = [...widget.cardDisplay];
      newOrder[index].enabled = !newOrder[index].enabled;
      setWidget({ ...widget, cardDisplay: newOrder });
   };

   return (
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
           <div>
              <h2 className="text-lg font-bold text-slate-800">悬浮球弹窗</h2>
              <p className="text-sm text-slate-500">点击网页悬浮球后，展开的单词列表弹窗的显示内容配置。</p>
           </div>
           
           {/* Master Switch */}
           <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={widget.enabled} 
                   onChange={(e) => setWidget({...widget, enabled: e.target.checked})} 
                   className="sr-only peer"
                 />
                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                 <span className="ml-3 text-sm font-medium text-slate-900">{widget.enabled ? '已开启' : '已关闭'}</span>
              </label>
           </div>
        </div>

        {widget.enabled && (
          <div className="p-6 space-y-8 animate-in slide-in-from-top-4">
             {/* 1. Content Filters */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">弹窗包含的词汇类型</h3>
                   <div className="space-y-3">
                      <label className="flex items-center">
                         <input type="checkbox" checked={widget.showSections.want} onChange={e => setWidget({...widget, showSections: {...widget.showSections, want: e.target.checked}})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm">想学习 (Want to Learn)</span>
                      </label>
                      <label className="flex items-center">
                         <input type="checkbox" checked={widget.showSections.learning} onChange={e => setWidget({...widget, showSections: {...widget.showSections, learning: e.target.checked}})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm">正在学 (Learning)</span>
                      </label>
                      <label className="flex items-center">
                         <input type="checkbox" checked={widget.showSections.known} onChange={e => setWidget({...widget, showSections: {...widget.showSections, known: e.target.checked}})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm">已掌握 (Mastered)</span>
                      </label>
                   </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">卡片显示内容配置</h3>
                   
                   {/* Fixed Toggles */}
                   <div className="grid grid-cols-2 gap-2 mb-4">
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showPhonetic} onChange={e => setWidget({...widget, showPhonetic: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示音标</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showMeaning} onChange={e => setWidget({...widget, showMeaning: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示释义</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showPartOfSpeech} onChange={e => setWidget({...widget, showPartOfSpeech: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示词性</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showTags} onChange={e => setWidget({...widget, showTags: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示等级标签</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showImportance} onChange={e => setWidget({...widget, showImportance: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示星级</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showCocaRank} onChange={e => setWidget({...widget, showCocaRank: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示 COCA</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showExampleTranslation} onChange={e => setWidget({...widget, showExampleTranslation: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示例句翻译</span>
                      </label>
                      <label className="flex items-center p-2 border border-slate-100 rounded bg-slate-50 cursor-pointer hover:bg-white transition">
                         <input type="checkbox" checked={widget.showContextTranslation} onChange={e => setWidget({...widget, showContextTranslation: e.target.checked})} className="rounded text-blue-600 mr-2"/>
                         <span className="text-sm font-medium text-slate-700">显示原句翻译</span>
                      </label>
                   </div>

                   <p className="text-[10px] text-slate-400 mb-2">* 以下例句内容可拖拽排序</p>
                   <div className="space-y-2">
                       {widget.cardDisplay.map((item, index) => (
                          <div 
                             key={item.id}
                             draggable
                             onDragStart={() => handleDragStart(index)}
                             onDragOver={(e) => handleDragOver(e, index)}
                             onDragEnd={handleDragEnd}
                             className={`flex items-center p-2 border rounded-lg bg-white cursor-move hover:border-blue-300 transition ${draggedItemIndex === index ? 'opacity-50 border-blue-400' : 'border-slate-200'}`}
                          >
                             <GripVertical className="w-4 h-4 text-slate-400 mr-3" />
                             <span className="text-sm flex-1">{item.label}</span>
                             <input type="checkbox" checked={item.enabled} onChange={() => toggleItem(index)} className="rounded text-blue-600" />
                          </div>
                       ))}
                   </div>
                </div>
             </div>
             
             {/* Preview of Widget Card */}
             <div className="border-t border-slate-100 pt-8">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">列表卡片样式预览</h3>
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 flex justify-center items-center">
                    {/* Clean Card Preview matching WordManager style - now WIDER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 w-full">
                         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">ephemeral</h3>
                                    
                                    {widget.showPartOfSpeech && (
                                        <span className="font-serif font-bold text-sm text-slate-400 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-100">adj.</span>
                                    )}

                                    {widget.showPhonetic && (
                                      <div className="flex items-center text-sm text-slate-500 space-x-3 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                         <span className="flex items-center"><span className="text-[10px] mr-1 text-slate-400 font-sans">US</span> /əˈfem(ə)rəl/ <PlayCircle className="w-3.5 h-3.5 ml-1 opacity-50"/></span>
                                      </div>
                                    )}
                                </div>
                                {widget.showMeaning && (
                                   <div className="text-slate-700 font-medium px-3 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-100 text-sm self-start">
                                     短暂的；朝生暮死的
                                   </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                               {widget.showTags && (
                                   <div className="flex gap-1">
                                       <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">GRE</span>
                                       <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">SAT</span>
                                   </div>
                               )}
                               <div className="flex items-center gap-3 text-xs text-slate-400">
                                   {widget.showImportance && (
                                       <div className="flex">
                                           {[...Array(5)].map((_, i) => (
                                               <Star key={i} className={`w-3 h-3 ${i < 2 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                           ))}
                                       </div>
                                   )}
                                   {widget.showCocaRank && (
                                       <span className="flex items-center">
                                           <BarChart2 className="w-3 h-3 mr-1"/> #12000
                                       </span>
                                   )}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-3">
                            {widget.cardDisplay.map(item => {
                                if (!item.enabled) return null;
                                if (item.id === 'context') return (
                                   <div key="ctx" className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                      <div className="absolute left-0 top-3 w-1 h-8 bg-blue-500 rounded-r"></div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">来源原句 (Context)</span>
                                      <p className="text-sm text-slate-700 leading-relaxed pl-2 mb-2">Fashion is by nature ephemeral.</p>
                                      {widget.showContextTranslation && <p className="text-xs text-slate-500 pl-2">时尚本质上是短暂的。</p>}
                                   </div>
                                );
                                if (item.id === 'mixed') return (
                                   <div key="mix" className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                      <div className="absolute left-0 top-3 w-1 h-8 bg-purple-500 rounded-r"></div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">中英混合 (Mixed)</span>
                                      <p className="text-sm text-slate-700 leading-relaxed pl-2">时尚本质上是 ephemeral (短暂) 的。</p>
                                   </div>
                                );
                                if (item.id === 'dictExample') return (
                                   <div key="dict" className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                      <div className="absolute left-0 top-3 w-1 h-8 bg-emerald-500 rounded-r"></div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">词典例句 (Dictionary)</span>
                                      <p className="text-sm text-slate-600 italic leading-relaxed pl-2">Her success was ephemeral.</p>
                                      {widget.showExampleTranslation && <p className="text-xs text-slate-500 pl-2">她的成功是短暂的。</p>}
                                   </div>
                                );
                                return null;
                            })}
                         </div>
                    </div>
                 </div>
             </div>
          </div>
        )}
      </section>
   );
};