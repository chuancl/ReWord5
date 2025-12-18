import React, { useState, useRef, useEffect } from 'react';
import { WordInteractionConfig, InteractionTrigger, ModifierKey, MouseAction, BubblePosition } from '../../types';
import { Volume2, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, ExternalLink, BookOpen } from 'lucide-react';
import { playWordAudio, playTextToSpeech } from '../../utils/audio';
import { browser } from 'wxt/browser';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg max-w-[200px] whitespace-normal text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

// Helper to map custom ModifierKey to DOM values
const getDomModifier = (m: string): string | null => {
  if (m === 'None') return null;
  if (m === 'Ctrl') return 'Control';
  return m;
};

const TriggerInput = ({ label, value, onChange }: { label: string, value: InteractionTrigger, onChange: (val: InteractionTrigger) => void }) => {
  const handleChange = (field: keyof InteractionTrigger, newVal: any) => {
     const updated = { ...value, [field]: newVal };
     if (field !== 'delay') {
        if (updated.modifier === 'None' && updated.action === 'Hover') {
           updated.delay = 600;
        } else {
           updated.delay = 0;
        }
     }
     onChange(updated);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 mb-1 block">控制键</label>
          <select 
            value={value.modifier} 
            onChange={(e) => handleChange('modifier', e.target.value as ModifierKey)}
            className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500"
          >
            <option value="None">无 (None)</option>
            <option value="Alt">Alt</option>
            <option value="Ctrl">Ctrl</option>
            <option value="Shift">Shift</option>
            <option value="Meta">Command / Win</option>
          </select>
        </div>
        <span className="text-slate-300 pt-4">+</span>
        <div className="flex-1">
           <label className="text-[10px] text-slate-500 mb-1 block">鼠标动作</label>
           <select 
             value={value.action} 
             onChange={(e) => handleChange('action', e.target.value as MouseAction)}
             className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500"
           >
             <option value="Hover">悬浮 (Hover)</option>
             <option value="Click">单击 (Click)</option>
             <option value="DoubleClick">双击 (Double)</option>
             <option value="RightClick">右键 (Right)</option>
           </select>
        </div>
        <span className="text-slate-300 pt-4">@</span>
        <div className="w-20">
           <div className="flex items-center mb-1 gap-1">
              <label className="text-[10px] text-slate-500 block">延迟 (ms)</label>
              <Tooltip text="仅在鼠标悬浮时建议设置延迟，避免误触。">
                 <Info className="w-3 h-3 text-slate-400 cursor-help" />
              </Tooltip>
           </div>
           <input 
             type="number" 
             step="100" min="0" 
             value={value.delay} 
             onChange={(e) => handleChange('delay', parseInt(e.target.value))}
             className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500"
           />
        </div>
      </div>
    </div>
  );
};

interface InteractionSectionProps {
  config: WordInteractionConfig;
  setConfig: React.Dispatch<React.SetStateAction<WordInteractionConfig>>;
}

export const InteractionSection: React.FC<InteractionSectionProps> = ({ config, setConfig }) => {
  
  // State for preview interaction simulation
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Handle Auto Pronounce in Preview (Simulate real logic)
  useEffect(() => {
      let isMounted = true;
      if (isPreviewVisible && config.autoPronounce && config.autoPronounceCount > 0) {
          (async () => {
              for (let i = 0; i < config.autoPronounceCount; i++) {
                  if (!isMounted || !isPreviewVisible) break;
                  // 核心：使用 playWordAudio 替代简单的 TTS
                  await playWordAudio("ephemeral", config.autoPronounceAccent);
                  if (i < config.autoPronounceCount - 1 && isMounted && isPreviewVisible) {
                    await new Promise(r => setTimeout(r, 300));
                  }
              }
          })();
      }
      return () => { isMounted = false; };
  }, [isPreviewVisible, config.autoPronounce, config.autoPronounceCount, config.autoPronounceAccent]);

  // --- Trigger Simulation Logic ---
  const handleTrigger = (action: MouseAction, e: React.MouseEvent) => {
      // Basic check for modifier (simplified for preview)
      const { modifier } = config.mainTrigger;
      
      const domModifier = getDomModifier(modifier);
      const isModifierMatch = !domModifier || e.getModifierState(domModifier as any);

      if (!isModifierMatch) return;

      if (config.mainTrigger.action === action) {
          e.preventDefault(); // For right click
          if (action !== 'Hover') {
             if (!isPreviewVisible) {
                setIsPreviewVisible(true);
             } else {
                setIsPreviewVisible(false);
             }
          }
      }
  };

  const onMouseEnter = (e: React.MouseEvent) => {
      if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
      }

      if (config.mainTrigger.action === 'Hover') {
         const { modifier } = config.mainTrigger;
         const domModifier = getDomModifier(modifier);
         if (domModifier && !e.getModifierState(domModifier as any)) return;

         if (showTimer.current) clearTimeout(showTimer.current);
         showTimer.current = setTimeout(() => {
             setIsPreviewVisible(true);
         }, config.mainTrigger.delay);
      }
  };

  const onMouseLeave = () => {
      if (showTimer.current) {
          clearTimeout(showTimer.current);
          showTimer.current = null;
      }
      
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
          setIsPreviewVisible(false);
      }, config.dismissDelay || 300);
  };

  const onBubbleEnter = () => {
      if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
      }
  };

  const onBubbleLeave = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
          setIsPreviewVisible(false);
      }, config.dismissDelay || 300);
  };

  // --- Actions ---
  const openDetailPreview = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = browser.runtime.getURL('/options.html?view=word-detail&word=ephemeral');
      window.open(url, '_blank');
  };

  // --- Layout & Styles ---
  const getPreviewPositionClass = (pos: BubblePosition) => {
     switch(pos) {
         case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
         case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-3';
         case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-3';
         case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-3';
         default: return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
     }
  };

  const getArrowClass = (pos: BubblePosition) => {
     switch(pos) {
         case 'top': return 'bottom-[-6px] left-[calc(50%-6px)] border-b-transparent border-r-transparent';
         case 'bottom': return 'top-[-6px] left-[calc(50%-6px)] border-t-transparent border-l-transparent';
         case 'left': return 'right-[-6px] top-[calc(50%-6px)] border-b-transparent border-l-transparent';
         case 'right': return 'left-[-6px] top-[calc(50%-6px)] border-t-transparent border-r-transparent';
         default: return 'bottom-[-6px] left-[calc(50%-6px)]';
     }
  };

  const getWordShiftClass = (pos: BubblePosition) => {
      switch(pos) {
          case 'left': return 'translate-x-24';
          case 'right': return '-translate-x-24';
          case 'top': return 'translate-y-16'; 
          case 'bottom': return '-translate-y-16';
          default: return '';
      }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">单词交互气泡</h2>
          <p className="text-sm text-slate-500">当鼠标与页面上被替换的单词交互时触发。</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <TriggerInput 
                    label="主触发方式 (查词弹窗)" 
                    value={config.mainTrigger} 
                    onChange={(val) => setConfig({...config, mainTrigger: val})}
                />

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">气泡位置</label>
                    <div className="flex gap-2">
                        {(['top', 'bottom', 'left', 'right'] as BubblePosition[]).map(pos => (
                             <button
                                key={pos}
                                onClick={() => setConfig({...config, bubblePosition: pos})}
                                className={`flex-1 py-2 rounded-lg border flex flex-col items-center justify-center transition-all ${config.bubblePosition === pos ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                             >
                                 {pos === 'top' && <ArrowUp className="w-4 h-4 mb-1"/>}
                                 {pos === 'bottom' && <ArrowDown className="w-4 h-4 mb-1"/>}
                                 {pos === 'left' && <ArrowLeft className="w-4 h-4 mb-1"/>}
                                 {pos === 'right' && <ArrowRight className="w-4 h-4 mb-1"/>}
                                 <span className="text-xs capitalize">{pos}</span>
                             </button>
                        ))}
                    </div>
                </div>

                <TriggerInput 
                    label="快速添加 (至正在学)" 
                    value={config.quickAddTrigger} 
                    onChange={(val) => setConfig({...config, quickAddTrigger: val})}
                />

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">自动朗读设置</label>
                   <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 mb-1 block">默认口音</label>
                        <select 
                          value={config.autoPronounceAccent} 
                          onChange={(e) => setConfig({...config, autoPronounceAccent: e.target.value as 'US' | 'UK'})}
                          className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500"
                        >
                          <option value="US">美式 (US)</option>
                          <option value="UK">英式 (UK)</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 mb-1 block">气泡显示时朗读次数</label>
                        <div className="flex items-center">
                           <input 
                             type="number" 
                             min="0"
                             max="5"
                             value={config.autoPronounceCount} 
                             onChange={(e) => setConfig({...config, autoPronounceCount: parseInt(e.target.value), autoPronounce: parseInt(e.target.value) > 0})}
                             className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500"
                           />
                        </div>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2">* 设置为 0 则不自动朗读。</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">气泡内容展示</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={config.showPhonetic} onChange={e => setConfig({...config, showPhonetic: e.target.checked})} className="rounded text-blue-600 mr-3"/>
                        <span className="text-sm">显示音标</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={config.showOriginalText} onChange={e => setConfig({...config, showOriginalText: e.target.checked})} className="rounded text-blue-600 mr-3"/>
                        <span className="text-sm">显示原中文</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={config.showDictExample} onChange={e => setConfig({...config, showDictExample: e.target.checked})} className="rounded text-blue-600 mr-3"/>
                        <span className="text-sm">显示例句</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={config.showDictTranslation} onChange={e => setConfig({...config, showDictTranslation: e.target.checked})} className="rounded text-blue-600 mr-3"/>
                        <span className="text-sm">显示释义</span>
                    </label>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg bg-slate-50">
                          <label className="text-[10px] text-slate-500 block mb-1">气泡消失延迟 (ms)</label>
                          <input 
                              type="number" 
                              step="100" min="0" 
                              value={config.dismissDelay || 300}
                              onChange={(e) => setConfig({...config, dismissDelay: parseInt(e.target.value)})}
                              className="w-full text-sm border-slate-300 rounded focus:ring-blue-500"
                          />
                      </div>
                      <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                          <input type="checkbox" checked={config.allowMultipleBubbles || false} onChange={e => setConfig({...config, allowMultipleBubbles: e.target.checked})} className="rounded text-blue-600 mr-3"/>
                          <div className="flex flex-col">
                             <span className="text-sm">允许同时存在多个气泡</span>
                             <span className="text-[10px] text-slate-400">开启后新气泡不关闭旧气泡</span>
                          </div>
                      </div>
                  </div>

                  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">在线词典链接 (URL Template)</label>
                      <input 
                          type="text" 
                          value={config.onlineDictUrl || ''} 
                          onChange={(e) => setConfig({...config, onlineDictUrl: e.target.value})}
                          placeholder="例如: https://dict.youdao.com/result?word={word}"
                          className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500 mb-1"
                      />
                      <p className="text-[10px] text-slate-400">配置后，气泡底部将显示跳转链接。使用 <code className="bg-slate-200 px-1 rounded text-slate-600">{`{word}`}</code> 作为单词占位符。</p>
                  </div>
              </div>
           </div>

           {/* Preview Bubble */}
           <div className="flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                 <span>交互效果预览</span>
                 <span className="text-[10px] font-normal text-blue-500 normal-case bg-blue-50 px-2 py-0.5 rounded">
                     试试 {config.mainTrigger.action === 'Hover' ? `悬浮 ${config.mainTrigger.delay}ms` : '点击'} 下面的单词
                 </span>
              </h3>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-8 flex items-center justify-center relative overflow-hidden min-h-[360px]">
                 <div className="absolute inset-0 grid grid-cols-[1fr_20px_1fr] grid-rows-[1fr_20px_1fr] opacity-5 pointer-events-none">
                    <div className="border-r border-slate-900 col-start-2 row-span-3"></div>
                    <div className="border-b border-slate-900 row-start-2 col-span-3"></div>
                 </div>
                 
                 <div 
                    className={`relative transition-transform duration-300 ${getWordShiftClass(config.bubblePosition)}`}
                 >
                    <span 
                        className="text-xl font-serif text-slate-800 cursor-pointer border-b-2 border-red-200 select-none"
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onClick={(e) => handleTrigger('Click', e)}
                        onDoubleClick={(e) => handleTrigger('DoubleClick', e)}
                        onContextMenu={(e) => handleTrigger('RightClick', e)}
                    >
                        ephemeral
                    </span>
                    
                    {/* The Bubble - Dynamically Positioned */}
                    {isPreviewVisible && (
                        <div 
                            className={`absolute w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-5 z-10 transition-all duration-300 animate-in fade-in zoom-in-95 ${getPreviewPositionClass(config.bubblePosition)}`}
                            onMouseEnter={onBubbleEnter}
                            onMouseLeave={onBubbleLeave}
                        >
                        
                            {/* Arrow - Dynamically Positioned */}
                            <div className={`absolute w-3 h-3 bg-white border border-slate-200 transform rotate-45 z-[-1] ${getArrowClass(config.bubblePosition)}`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-xl text-slate-900 leading-tight mb-1">ephemeral</h4>
                                    {config.showPhonetic && <span className="text-xs text-slate-400 font-mono block">/əˈfem(ə)rəl/</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-full transition-colors bg-transparent"
                                        onClick={() => playWordAudio("ephemeral", config.autoPronounceAccent)}
                                        title="点击播放"
                                    >
                                        <Volume2 className="w-4 h-4"/>
                                    </button>
                                    <button 
                                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                                        title="添加到正在学"
                                    >
                                        <Plus className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                            
                            {config.showDictTranslation && (
                                <div className="text-sm text-slate-700 font-medium mb-3 leading-snug">adj. 短暂的；朝生暮死的</div>
                            )}

                            {config.showOriginalText && (
                                <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md mb-3 border border-slate-100">
                                    <span className="mr-2 text-slate-400">原文:</span>
                                    <span className="text-slate-700 font-medium">短暂的</span>
                                </div>
                            )}

                            {config.showDictExample && (
                                <div className="text-xs text-slate-600 italic border-l-2 border-blue-400 pl-3 py-0.5 leading-relaxed cursor-pointer hover:text-blue-600" onClick={() => playWordAudio("Her success was ephemeral", config.autoPronounceAccent)}>
                                    Her success was ephemeral.
                                </div>
                            )}

                            {/* Link Container (Detail & Online Dict) */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4">
                                <button 
                                    onClick={openDetailPreview}
                                    className="flex items-center text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
                                    title="查看详细释义、词源、例句等"
                                >
                                    <BookOpen className="w-3 h-3 mr-1.5" />
                                    详细信息
                                </button>

                                {config.onlineDictUrl && (
                                    <a 
                                        href={config.onlineDictUrl.replace('{word}', 'ephemeral')} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1.5" />
                                        在线词典
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
    </section>
  );
};