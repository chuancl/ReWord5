

import React, { useState } from 'react';
import { TranslationEngine, EngineType, DictionaryEngine } from '../../types';
import { Plus, GripVertical, RefreshCw, CheckCircle, WifiOff, Trash2, Globe, BrainCircuit, X, Book, ExternalLink } from 'lucide-react';
import { callTencentTranslation } from '../../utils/api';
import { dictionariesStorage } from '../../utils/storage';

// Simple Tooltip component internal to section
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

  const handleDragStart = (index: number) => {
    setDraggedEngineIndex(index);
  };

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

  const handleDragEnd = () => {
    setDraggedEngineIndex(null);
  };

  const toggleEngine = (id: string) => {
    setEngines(prev => prev.map(e => e.id === id ? { ...e, isEnabled: !e.isEnabled } : e));
  };
  
  const handleDeleteEngine = (id: string) => {
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
      if (engine.id === 'tencent') {
         // Testing with Target='zh' implies we send English or "Hello" and expect Chinese back to verify key works
         await callTencentTranslation(engine, "Hello", 'zh');
         setEngines(prev => prev.map(e => e.id === id ? { ...e, isTesting: false, testResult: 'success' } : e));
      } else if (engine.id === 'custom-mock') {
         // Mock success
         setTimeout(() => {
             setEngines(prev => prev.map(e => e.id === id ? { ...e, isTesting: false, testResult: 'success' } : e));
         }, 500);
      } else {
         throw new Error("此引擎暂未实现真实连接测试 (仅支持腾讯云)");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Unknown Error';
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 flex items-center transition"
            >
               <Plus className="w-4 h-4 mr-2"/> 添加自定义引擎
            </button>
        </div>
        
        {/* Engine List */}
        <div className="p-6 space-y-4">
          {engines.map((engine, index) => (
            <div 
              key={engine.id} 
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group border rounded-lg p-4 transition-all relative cursor-move ${engine.isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'} ${draggedEngineIndex === index ? 'opacity-50 border-blue-400 bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 pt-1 text-slate-300">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                </div>
                
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    checked={engine.isEnabled} 
                    onChange={() => toggleEngine(engine.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-800">{engine.name}</span>
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${engine.type === 'ai' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                         {engine.type === 'ai' ? 'AI Model' : 'Standard API'}
                       </span>
                    </div>
                    <div className="flex items-center space-x-2">
                       {engine.isTesting && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                       {engine.testResult === 'success' && <span className="flex items-center text-xs text-green-600"><CheckCircle className="w-3 h-3 mr-1"/> 正常</span>}
                       {engine.testResult === 'fail' && (
                           <Tooltip text={engine.testErrorMessage || "未知错误"}>
                               <span className="flex items-center text-xs text-red-600 cursor-help"><WifiOff className="w-3 h-3 mr-1"/> 失败</span>
                           </Tooltip>
                       )}
                       {engine.isEnabled && (
                         <button onClick={() => testConnection(engine.id)} className="text-xs text-blue-600 hover:underline">测试连接</button>
                       )}
                       <button 
                         type="button"
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEngine(engine.id); }} 
                         className="text-slate-400 hover:text-red-600 ml-2 p-1.5 rounded hover:bg-red-50 transition flex items-center z-10 relative" 
                         title="删除引擎"
                         onMouseDown={(e) => e.stopPropagation()}
                       >
                          <Trash2 className="w-4 h-4"/>
                       </button>
                    </div>
                  </div>
                  
                  {engine.isEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm animate-in fade-in slide-in-from-top-2 cursor-default" onMouseDown={e => e.stopPropagation()}>
                       {engine.id !== 'google' && engine.id !== 'tencent' && engine.id !== 'custom-mock' && (
                         <input type="password" placeholder="API Key" className="px-3 py-2 border border-slate-300 rounded w-full" defaultValue={engine.apiKey} />
                       )}
                       
                       {/* Tencent Special Fields */}
                       {engine.id === 'tencent' && (
                          <>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">SecretId</label>
                                 <input type="text" placeholder="AKID..." className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" 
                                    value={engine.appId || ''} 
                                    onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, appId: e.target.value} : en))}
                                 />
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">SecretKey</label>
                                 <input type="password" placeholder="Key..." className="px-3 py-2 border border-slate-300 rounded w-full font-mono text-xs" 
                                    value={engine.secretKey || ''}
                                    onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, secretKey: e.target.value} : en))}
                                 />
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">Region</label>
                                 <input type="text" placeholder="ap-shanghai" className="px-3 py-2 border border-slate-300 rounded w-full text-xs" 
                                    value={engine.region || ''}
                                    onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, region: e.target.value} : en))}
                                 />
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-[10px] text-slate-500 mb-1 block">ProjectId</label>
                                 <input type="number" placeholder="0" className="px-3 py-2 border border-slate-300 rounded w-full text-xs" 
                                    value={engine.projectId || 0}
                                    onChange={e => setEngines(prev => prev.map(en => en.id === engine.id ? {...en, projectId: parseInt(e.target.value)} : en))}
                                 />
                             </div>
                          </>
                       )}

                       {(engine.id === 'baidu' || engine.id === 'volcengine') && (
                          <input type="text" placeholder="App ID" className="px-3 py-2 border border-slate-300 rounded w-full" defaultValue={engine.appId} />
                       )}
                       {(engine.id === 'volcengine' || engine.id === 'iflytek' || engine.id === 'baidu') && (
                          <input type="password" placeholder="Secret Key" className="px-3 py-2 border border-slate-300 rounded w-full" defaultValue={engine.secretKey} />
                       )}
                       {engine.type === 'ai' && (
                          <input type="text" placeholder="Model Name (e.g. gpt-4)" className="px-3 py-2 border border-slate-300 rounded w-full" defaultValue={engine.model} />
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Dictionary Sources Section */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <Book className="w-4 h-4 mr-2 text-slate-500"/>
                词典数据源 (Dictionary Sources)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                当新增单词时，系统会自动从以下免费词典 API 补充音标、例句和详细释义。建议开启国内可用的数据源 (ICBA/Youdao) 以获得最佳体验。
            </p>
            <div className="space-y-3">
                {dictionaries.map(dict => (
                    <div key={dict.id} className={`flex items-start gap-3 p-3 border rounded-lg shadow-sm transition-all ${dict.isEnabled ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-100 opacity-70'}`}>
                         <div className="pt-0.5">
                            <input 
                              type="checkbox" 
                              checked={dict.isEnabled} 
                              onChange={() => toggleDictionary(dict.id)}
                              className="rounded text-blue-600 w-4 h-4 cursor-pointer" 
                            />
                         </div>
                         <div className="flex-1">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{dict.name}</span>
                                {dict.priority === 1 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">首选 (Primary)</span>}
                                {dict.priority > 2 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">备用 (Fallback)</span>}
                                <a href={dict.link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-blue-500 hover:underline flex items-center">
                                    <Globe className="w-3 h-3 mr-1"/> 官网
                                </a>
                             </div>
                             <div className="text-xs text-slate-500 mt-1">{dict.description}</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>

        {isModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">添加自定义引擎</h3>
                  <button onClick={() => { setIsModalOpen(false); setNewEngineType(null); }}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
               </div>
               
               <div className="p-6">
                 {!newEngineType ? (
                   <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => setNewEngineType('standard')}
                       className="p-6 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition text-left group"
                     >
                       <div className="bg-white w-10 h-10 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                         <Globe className="w-6 h-6 text-blue-600" />
                       </div>
                       <div className="font-bold text-slate-900 mb-1">普通翻译 API</div>
                       <p className="text-xs text-slate-500 leading-relaxed">适用于 Google Translate API, DeepL, 百度翻译等传统接口。</p>
                     </button>
                     <button 
                       onClick={() => setNewEngineType('ai')}
                       className="p-6 rounded-xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition text-left group"
                     >
                        <div className="bg-white w-10 h-10 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                         <BrainCircuit className="w-6 h-6 text-purple-600" />
                       </div>
                       <div className="font-bold text-slate-900 mb-1">AI 大模型</div>
                       <p className="text-xs text-slate-500 leading-relaxed">适用于 OpenAI, Gemini, Claude, Kimi 等 LLM 服务。</p>
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-200">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">服务名称</label>
                       <input 
                         type="text" 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                         placeholder={newEngineType === 'ai' ? "例如: OpenAI (GPT-4)" : "例如: 阿里翻译"}
                         onChange={e => setNewEngineData({...newEngineData, name: e.target.value})}
                       />
                     </div>
                     <div className="pt-4 flex gap-3">
                       <button onClick={() => setNewEngineType(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">返回类型选择</button>
                       <button onClick={handleAddEngine} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">确认添加</button>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </div>
        )}
    </section>
  );
};