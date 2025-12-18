
import React, { useState } from 'react';
import { AutoTranslateConfig } from '../../types';
import { ShieldAlert, ShieldCheck, X, Mic2, SplitSquareHorizontal, Scan, Zap, AlertTriangle, Power, Globe } from 'lucide-react';

interface GeneralSectionProps {
  config: AutoTranslateConfig;
  setConfig: React.Dispatch<React.SetStateAction<AutoTranslateConfig>>;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ config, setConfig }) => {
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newWhitelist, setNewWhitelist] = useState('');

  const addBlacklist = () => {
    if (newBlacklist.trim()) {
      setConfig({ ...config, blacklist: [...config.blacklist, newBlacklist.trim()] });
      setNewBlacklist('');
    }
  };

  const addWhitelist = () => {
    if (newWhitelist.trim()) {
      setConfig({ ...config, whitelist: [...config.whitelist, newWhitelist.trim()] });
      setNewWhitelist('');
    }
  };

  const removeBlacklist = (item: string) => {
    setConfig({ ...config, blacklist: config.blacklist.filter(i => i !== item) });
  };

  const removeWhitelist = (item: string) => {
    setConfig({ ...config, whitelist: config.whitelist.filter(i => i !== item) });
  };

  // Helper component for toggle items
  const ToggleCard = ({ 
    title, 
    desc, 
    icon: Icon, 
    checked, 
    onChange, 
    colorClass = "text-blue-600 bg-blue-50 border-blue-100",
    warning
  }: { 
    title: string; 
    desc: string; 
    icon: any; 
    checked: boolean; 
    onChange: (val: boolean) => void;
    colorClass?: string;
    warning?: React.ReactNode;
  }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${checked ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
       <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-lg border ${colorClass} shrink-0`}>
              <Icon className="w-5 h-5" />
          </div>
          <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                  {desc}
              </p>
              {warning && <div className="mt-2">{warning}</div>}
          </div>
       </div>
       <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={e => onChange(e.target.checked)} 
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
       </label>
    </div>
  );

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-slate-400"/>
            常规选项
        </h2>
        <p className="text-sm text-slate-500 mt-1">控制插件的全局行为、翻译范围及网站生效规则。</p>
      </div>
      
      <div className="p-6 space-y-8">
        
        {/* Core Settings Grid */}
        <div className="grid grid-cols-1 gap-4">
            <ToggleCard 
                title="默认开启翻译" 
                desc="在浏览网页时自动运行上下文单词替换。您可以通过下方的黑/白名单精确控制具体生效的网站。"
                icon={Power}
                checked={config.enabled}
                onChange={v => setConfig({...config, enabled: v})}
                colorClass="text-blue-600 bg-blue-50 border-blue-100"
            />

            <ToggleCard 
                title="扫描整个页面" 
                desc="默认仅处理页面的主要内容区域（Main/Article）。开启后将扩大范围至侧边栏、导航及页脚等区域，可能会略微影响性能。"
                icon={Scan}
                checked={config.translateWholePage}
                onChange={v => setConfig({...config, translateWholePage: v})}
                colorClass="text-purple-600 bg-purple-50 border-purple-100"
            />

            <ToggleCard 
                title="双语对照模式" 
                desc="在被翻译的段落末尾追加显示完整的中文译文，帮助您更好地理解上下文语境。"
                icon={SplitSquareHorizontal}
                checked={config.bilingualMode}
                onChange={v => setConfig({...config, bilingualMode: v})}
                colorClass="text-indigo-600 bg-indigo-50 border-indigo-100"
            />

            <ToggleCard 
                title="激进匹配模式 (Aggressive Mode)" 
                desc="当单词在译文中存在但因变形或翻译差异未匹配时，尝试实时调用词典 API 获取所有释义进行二次模糊匹配。"
                icon={Zap}
                checked={config.aggressiveMode}
                onChange={v => setConfig({...config, aggressiveMode: v})}
                colorClass="text-amber-600 bg-amber-50 border-amber-100"
                warning={
                    config.aggressiveMode ? (
                        <div className="flex items-center text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1"/> 
                            注意：开启后会显著增加 API 请求量。
                        </div>
                    ) : null
                }
            />
        </div>

        {/* TTS Speed Setting */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex items-center gap-6">
           <div className="flex items-center gap-3 min-w-[120px]">
               <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shadow-sm">
                   <Mic2 className="w-4 h-4" />
               </div>
               <div>
                   <h3 className="font-bold text-slate-900 text-sm">朗读速度</h3>
                   <span className="text-xs text-slate-400">TTS Playback</span>
               </div>
           </div>
           
           <div className="flex-1 flex items-center gap-4 bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-medium font-mono">0.25x</span>
              <div className="flex-1 relative h-6 flex items-center group">
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 group-hover:border-blue-100 transition-colors">
                       <div 
                         className="h-full bg-blue-500 rounded-full transition-all duration-150" 
                         style={{width: `${Math.max(0, Math.min(100, ((config.ttsSpeed || 1.0) - 0.25) / 2.75 * 100))}%`}}
                       ></div>
                   </div>
                   <input 
                     type="range" 
                     min="0.25" 
                     max="3.0" 
                     step="0.25"
                     value={config.ttsSpeed || 1.0}
                     onChange={(e) => setConfig({...config, ttsSpeed: parseFloat(e.target.value)})}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <div 
                      className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow pointer-events-none transition-all duration-150 group-hover:scale-110"
                      style={{left: `${Math.max(0, Math.min(100, ((config.ttsSpeed || 1.0) - 0.25) / 2.75 * 100))}%`, transform: 'translateX(-50%)'}}
                   ></div>
              </div>
              <div className="flex items-center justify-center min-w-[50px] bg-slate-50 rounded border border-slate-200 py-0.5 px-2">
                  <span className="text-xs font-bold text-slate-700 font-mono">{(config.ttsSpeed || 1.0).toFixed(2)}x</span>
              </div>
           </div>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Blacklist */}
           <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold text-slate-800">黑名单 (永远不翻译)</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">{config.blacklist.length} 条规则</span>
              </div>
              
              <div className="flex gap-2 mb-4">
                 <input 
                    type="text" 
                    value={newBlacklist}
                    onChange={e => setNewBlacklist(e.target.value)}
                    placeholder="例如: baidu.com"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                    onKeyDown={e => e.key === 'Enter' && addBlacklist()}
                 />
                 <button onClick={addBlacklist} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 transition shadow-sm">添加</button>
              </div>
              
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden min-h-[120px]">
                 <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {config.blacklist.length > 0 ? (
                        config.blacklist.map(site => (
                            <div key={site} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-xs border border-slate-100 group hover:border-red-100 hover:bg-red-50 transition-colors">
                            <span className="font-mono text-slate-600 truncate">{site}</span>
                            <button onClick={() => removeBlacklist(site)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5"/></button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                            <ShieldAlert className="w-8 h-8 mb-2 opacity-20"/>
                            <span className="text-xs">暂无黑名单规则</span>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Whitelist */}
           <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-bold text-slate-800">白名单 (强制翻译)</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">{config.whitelist.length} 条规则</span>
              </div>
              
              <div className="flex gap-2 mb-4">
                 <input 
                    type="text" 
                    value={newWhitelist}
                    onChange={e => setNewWhitelist(e.target.value)}
                    placeholder="例如: nytimes.com"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all"
                    onKeyDown={e => e.key === 'Enter' && addWhitelist()}
                 />
                 <button onClick={addWhitelist} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 transition shadow-sm">添加</button>
              </div>
              
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden min-h-[120px]">
                 <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {config.whitelist.length > 0 ? (
                        config.whitelist.map(site => (
                            <div key={site} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-xs border border-slate-100 group hover:border-green-100 hover:bg-green-50 transition-colors">
                            <span className="font-mono text-slate-600 truncate">{site}</span>
                            <button onClick={() => removeWhitelist(site)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5"/></button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                            <ShieldCheck className="w-8 h-8 mb-2 opacity-20"/>
                            <span className="text-xs">暂无白名单规则</span>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
};
