import React, { useState } from 'react';
import { TranslationEngine, EngineType, DictionaryEngine } from '../../types';
import { Plus, GripVertical, RefreshCw, CheckCircle, WifiOff, Trash2, Globe, BrainCircuit, X, Book, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { translateWithEngine } from '../../utils/api';
import { dictionariesStorage } from '../../utils/storage';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg max-w-[250px] whitespace-normal text-center leading-relaxed">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

interface EnginesSectionProps {
    engines: TranslationEngine[];
    setEngines: React.Dispatch<React.SetStateAction<TranslationEngine[]>>;
    dictionaries: DictionaryEngine[];
}

export const EnginesSection: React.FC<EnginesSectionProps> = ({ engines, setEngines, dictionaries }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEngineType, setNewEngineType] = useState<EngineType | null>(null);
  const [newEngineData, setNewEngineData] = useState<Partial<TranslationEngine>>({});
  const [draggedEngineIndex, setDraggedEngineIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggedEngineIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedEngineIndex === null || draggedEngineIndex === index) return;
    const newEngines = [...engines];
    const draggedItem = newEngines[draggedEngineIndex];
    newEngines.splice(draggedEngineIndex, 1);
    newEngines.splice(index, 0, draggedItem);
    setEngines(newEngines);
    setDraggedEngineIndex(index);
  };
  const handleDragEnd = () => setDraggedEngineIndex(null);

  const toggleEngine = (id: string) => {
    setEngines(prev => prev.map(e => e.id === id ? { ...e, isEnabled: !e.isEnabled } : e));
  };
  
  const handleDeleteEngine = (id: string) => {
    if (['google', 'baidu', 'deepl', 'microsoft'].includes(id)) {
        if (!confirm('这是系统内置引擎，确定要删除吗？')) return;
    }
    setEngines(prev => prev.filter(e => e.id !== id));
  };

  const toggleDictionary = async (id: string) => {
      const updated = dictionaries.map(d => d.id === id ? { ...d, isEnabled: !d.isEnabled } : d);
      await dictionariesStorage.setValue(updated);
  };

  const testConnection = async (id: string) => {
    setEngines(prev => prev.map(e => e.id === id ? { ...e, isTesting: true, testResult: null, testErrorMessage: undefined } : e));
    const engine = engines.find(e => e.id === id);
    if (!engine) return;

    try {
      const testResult = await translateWithEngine(engine, "Hello World", "zh");
      setEngines(prev => prev.map(e => e.id === id ? { ...e, isTesting: false, testResult: 'success' } : e));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '未知错误';
      setEngines(prev => prev.map(e => e.id === id ? { ...e, isTesting: false, testResult: 'fail', testErrorMessage: errMsg } : e));
    }
  };

  const handleAddEngine = () => {
    if (!newEngineData.name || !newEngineType) return;
    const newEngine: TranslationEngine = {
      id: `custom-${Date.now()}`,
      name: newEngineData.name,
      type: newEngineType,
      isEnabled: true,
      isCustom: true,
      apiKey: newEngineData.apiKey || '',
      endpoint: newEngineData.endpoint || '',
      model: newEngineData.model || '',
      appId: newEngineData.appId || '',
      secretKey: newEngineData.secretKey || ''
    };
    setEngines([...engines, newEngine]);
    setIsModalOpen(false);
    setNewEngineType(null);
    setNewEngineData({});
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">翻译引擎配置</h2>
              <p className="text-sm text-slate-500 mt-1">配置翻译 API。系统将按列表顺序依次尝试调用 (拖拽调整顺序)。</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 flex items-center transition">
               <Plus className="w-4 h-4 mr-2"/> 添加自定义引擎
            </button>
        </div>
        <div className="p-6 space-y-4">
          {engines.map((engine, index) => (
            <div key={engine.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`group border rounded-lg p-4 transition-all relative cursor-move ${engine.isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'} ${draggedEngineIndex === index ? 'opacity-50 border-blue-400 bg-blue-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 pt-1 text-slate-300"><GripVertical className="w-5 h-5 text-slate-400" /></div>
                <div className="pt-1">
                  <input type="checkbox" checked={engine.isEnabled} onChange={() => toggleEngine(engine.id)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-800">{engine.name}</span>
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${engine.id === 'google' || engine.id === 'baidu' || engine.id === 'microsoft' || engine.isWebSimulation ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : engine.type === 'ai' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                           {engine.id === 'google' || engine.id === 'baidu' || engine.id === 'microsoft' || engine.isWebSimulation ? '网页模拟 (免 Key)' : engine.type === 'ai' ? 'AI 模型' : '标准 API'}
                       </span>
                    </div>
                    <div className="flex items-center space-x-2">
                       {engine.isTesting && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                       {engine.testResult === 'success' && <span className="flex items-center text-xs text-green-600"><CheckCircle className="w-3 h-3 mr-1"/> 正常</span>}
                       {engine.testResult === 'fail' && (
                         <Tooltip text={engine.testErrorMessage || "未知错误"}>
                           <span className="flex items-center text-xs text-red-600 cursor-help bg-red-50 px-2 py-0.5 rounded border border-red-100 font-bold">
                             <AlertCircle className="w-3 h-3 mr-1"/> 测试失败
                           </span>
                         </Tooltip>
                       )}
                       {engine.isEnabled && <button onClick={() => testConnection(engine.id)} className="text-xs text-blue-600 hover:underline">测试连接</button>}
                       <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEngine(engine.id); }} className="text-slate-400 hover:text-red-600 ml-2 p-1.5 rounded hover:bg-red-50 transition flex items-center z-10 relative" title="删除引擎" onMouseDown={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  {engine.isEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm animate-in fade-in slide-in-from-top-2 cursor-default" onMouseDown={e => e.stopPropagation()}>
                       
                       {/* Google 专用说明 */}
                       {engine.id === 'google' && (
                          <div className="col-span-2 text-[11px] text-emerald-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                              <div className="mt-0.5"><Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /></div>
                              <p><b>Google 网页模拟模式：</b>无需 API Key。注：国内使用需配合全局 VPN。</p>
                          </div>
                       )}

                       {/* 微软 专用说明 */}
                       {engine.id === 'microsoft' && (
                          <div className="col-span-2 text-[11px] text-emerald-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                              <div className="mt-0.5"><Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /></div>
                              <p><b>微软翻译模拟模式：</b>通过模拟 Bing 官网接口实现，无需 Key 即可使用。</p>
                          </div>
                       )}

                       {/* 百度专用说明 */}
                       {engine.id === 'baidu' && (
                          <div className="col-span-2 text-[11px] text-emerald-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                              <div className="mt-0.5"><Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /></div>
                              <p><b>百度网页模拟模式：</b>无需 API Key。针对国内环境优化，如果频繁报错请改用 Google 或微软。</p>
                          </div>
                       )}

                       {/* DeepL 专用字段 */}
                       {engine.id === 'deepl' && (
                         <div className="col-span-2 space-y-3">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button 
                                    onClick={() => setEngines(prev => prev.map(en => en.id === 'deepl' ? {...en, isWebSimulation: true} : en))}
                                    className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded-md transition ${engine.isWebSimulation ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Zap className="w-3 h-3 mr-1.5" /> 网页模拟 (免 Key)
                                </button>
                                <button 
                                    onClick={() => setEngines(prev => prev.map(en => en.id === 'deepl' ? {...en, isWebSimulation: false} : en))}
                                    className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded-md transition ${!engine.isWebSimulation ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    官方 API 模式
                                </button>
                            </div>
                            {engine.isWebSimulation ? (
                                <div className="text-[11px] text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5"><Zap className="w-3.5 h-3.5 text-blue-400" /></div>
                                        <p>网页模拟模式：模拟浏览器直接调用 DeepL。注意：频率限制较严。</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in-95">
                                    <label className="text-[10px] text-slate-500 mb-1 block">DeepL API Key</label>
                                    <input type="password" placeholder="请输入 API Key" className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" value={engine.apiKey || ''} onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, apiKey: e.target.value} : en))} />
                                </div>
                            )}
                         </div>
                       )}

                       {/* 腾讯专用字段 */}
                       {engine.id === 'tencent' && (
                          <>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">SecretId</label>
                                 <input type="text" placeholder="AKID..." className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" value={engine.appId || ''} onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, appId: e.target.value} : en))} />
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">SecretKey</label>
                                 <input type="password" placeholder="Key..." className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" value={engine.secretKey || ''} onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, secretKey: e.target.value} : en))} />
                             </div>
                          </>
                       )}
                       
                       {/* 小牛翻译 */}
                       {engine.id === 'niutrans' && (
                         <div className="col-span-2">
                             <label className="text-[10px] text-slate-500 mb-1 block">API Key</label>
                             <input type="password" placeholder="请输入 API Key" className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" value={engine.apiKey || ''} onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, apiKey: e.target.value} : en))} />
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><Book className="w-4 h-4 mr-2 text-slate-500"/> 词典数据源</h3>
            <div className="space-y-3">
                {dictionaries.map(dict => (
                    <div key={dict.id} className={`flex items-start gap-3 p-3 border rounded-lg shadow-sm transition-all ${dict.isEnabled ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-100 opacity-70'}`}>
                         <div className="pt-0.5"><input type="checkbox" checked={dict.isEnabled} onChange={() => toggleDictionary(dict.id)} className="rounded text-blue-600 w-4 h-4 cursor-pointer" /></div>
                         <div className="flex-1">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{dict.name}</span>
                                {dict.priority === 1 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">首选</span>}
                                <a href={dict.link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-500 hover:underline flex items-center"><Globe className="w-3 h-3 mr-1"/> 官网</a>
                             </div>
                             <div className="text-xs text-slate-500 mt-1">{dict.description}</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};