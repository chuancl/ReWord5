
import React, { useState } from 'react';
import { TranslationEngine, WordEntry, StyleConfig, WordCategory, OriginalTextConfig, AutoTranslateConfig } from '../../types';
import { RefreshCw, Play, AlertCircle, Zap, SplitSquareHorizontal } from 'lucide-react';
import { callTencentTranslation } from '../../utils/api';
import { findFuzzyMatches } from '../../utils/matching';
import { buildReplacementHtml } from '../../utils/dom-builder';

interface PreviewSectionProps {
    engines: TranslationEngine[];
    entries: WordEntry[];
    styles: Record<WordCategory, StyleConfig>;
    originalTextConfig: OriginalTextConfig;
    autoTranslateConfig: AutoTranslateConfig;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ engines, entries, styles, originalTextConfig, autoTranslateConfig }) => {
    const [inputText, setInputText] = useState("我非常喜欢吃苹果，因为它们很健康。");
    const [translatedText, setTranslatedText] = useState("");
    const [replacementResult, setReplacementResult] = useState<React.ReactNode>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePreview = async () => {
        setIsLoading(true);
        setError(null);
        setTranslatedText("");
        setReplacementResult(null);

        try {
            const activeEngine = engines.find(e => e.isEnabled);
            if (!activeEngine) throw new Error("请先启用一个翻译引擎");

            // STEP 1: API Call (Full Translation)
            let apiResult = "";
            if (activeEngine.id === 'tencent') {
                const res = await callTencentTranslation(activeEngine, inputText, 'en');
                apiResult = res.Response?.TargetText || "";
            } else {
                 apiResult = "Simulated: I really like eating apples because they are healthy.";
            }
            // Store for bilingual display if needed
            setTranslatedText(apiResult);

            if (!apiResult) {
                setReplacementResult(<span>{inputText}</span>);
                return;
            }

            // STEP 2: Fuzzy Matching with Context Verification
            // Note: findFuzzyMatches v2 takes the translated text as the 3rd argument
            const finalMatches = findFuzzyMatches(inputText, entries, apiResult);

            // STEP 3: Render Mixed Text
            const sortedEntries = finalMatches.sort((a, b) => b.text.length - a.text.length);
            
            let mixedContent: React.ReactNode;

            if (sortedEntries.length === 0) {
                 mixedContent = <span>{inputText}</span>;
            } else {
                const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(${sortedEntries.map(e => escapeRegExp(e.text)).join('|')})`, 'g');
                const parts = inputText.split(pattern);
                
                mixedContent = (
                    <div>
                        {parts.map((part, idx) => {
                            const match = sortedEntries.find(e => e.text === part);
                            if (match) {
                                // Using buildReplacementHtml to ensure preview matches actual content script logic exactly
                                const html = buildReplacementHtml(
                                    match.text,
                                    match.entry.text,
                                    match.entry.category,
                                    styles,
                                    originalTextConfig,
                                    match.entry.id
                                );
                                
                                return <span key={idx} dangerouslySetInnerHTML={{__html: html}}></span>;
                            }
                            return <span key={idx}>{part}</span>;
                        })}
                    </div>
                );
            }

            setReplacementResult(mixedContent);

        } catch (err: any) {
            setError(err.message || "生成预览失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-amber-500" />
                    真实效果预览
                </h2>
                <p className="text-sm text-slate-500 mt-1">模拟真实网页上的翻译与替换效果，验证当前引擎与样式配置。</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">输入中文文本</label>
                    <div className="relative">
                        <textarea 
                            className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 h-64 resize-none leading-relaxed"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="输入一段包含你词库中单词的中文文本，以测试上下文替换..."
                        />
                        <div className="absolute bottom-4 right-4">
                             <button 
                                onClick={handleGeneratePreview}
                                disabled={isLoading}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
                             >
                                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin"/> : <Play className="w-4 h-4 mr-2 fill-current"/>}
                                生成预览
                             </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center">
                        <Zap className="w-3 h-3 mr-1"/> 提示: 系统会自动使用已配置的翻译引擎进行翻译，并校验译文是否包含目标词。
                    </p>
                </div>

                {/* Output Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">插件替换效果</label>
                        <div className="flex gap-2">
                            {autoTranslateConfig.matchInflections && (
                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center font-medium">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span> 词态匹配
                                </span>
                            )}
                            {autoTranslateConfig.bilingualMode && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center font-medium">
                                    <SplitSquareHorizontal className="w-3 h-3 mr-1" /> 双语对照
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-white border border-slate-200 rounded-xl text-base leading-loose text-slate-800 min-h-[16rem] shadow-sm relative">
                         {replacementResult ? (
                             <div className="animate-in fade-in duration-300">
                                 {/* Mixed Content */}
                                 {replacementResult}

                                 {/* Bilingual Block (If Enabled) */}
                                 {autoTranslateConfig.bilingualMode && translatedText && (
                                     <div className="context-lingo-bilingual-block mt-4 animate-in slide-in-from-top-2">
                                         {translatedText}
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-slate-300 italic pointer-events-none">
                                 点击“生成预览”查看效果...
                             </div>
                         )}
                    </div>
                    
                    {error && (
                        <div className="flex items-center text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in slide-in-from-bottom-2">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
