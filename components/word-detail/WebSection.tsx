
import React, { useState } from 'react';
import { FileQuestion, Network, BookOpen, Volume2, Tag, CheckCircle2, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { IndividualData, WebTransData, WikiDigestData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';
import { playUrl } from '../../utils/audio';

// --- 1. Exams Section ---
export const ExamsSection: React.FC<{ individual?: IndividualData }> = ({ individual }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!individual) return null;
    
    const { examInfo, pastExamSents, idiomatic } = individual;
    const questionTypes = examInfo?.questionTypeInfo || [];
    const sentences = pastExamSents || [];
    const phrases = idiomatic || [];

    if (questionTypes.length === 0 && sentences.length === 0 && phrases.length === 0) return null;

    const displayedSentences = isExpanded ? sentences : sentences.slice(0, 5);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <FileQuestion className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">考试真题 (Exams)</h3>
            </div>

            {/* 1. Idiomatic Phrases (Moved to Top) */}
            {phrases.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> 考点词组
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {phrases.map((phrase, idx) => (
                            <div key={idx} className="flex flex-col p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all bg-white group">
                                <span className="font-bold text-slate-700 text-sm mb-1 group-hover:text-indigo-700 transition-colors">{phrase.colloc?.en}</span>
                                <span className="text-xs text-slate-500">{phrase.colloc?.zh}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Exam Frequency Stats (Tag Cloud) */}
            {questionTypes.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                        <Tag className="w-3 h-3 mr-1.5" /> 题型出现频率
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {questionTypes.map((q, idx) => (
                            <div key={idx} className="flex items-center bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 hover:shadow-sm transition-all group cursor-default">
                                <span className="text-sm font-bold text-indigo-700 mr-2 group-hover:text-indigo-800">{q.type}</span>
                                <span className="text-xs font-bold text-white bg-indigo-400 px-1.5 py-0.5 rounded-md min-w-[24px] text-center">
                                    {q.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Past Exam Sentences (With Show More) */}
            {sentences.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                        <Quote className="w-3 h-3 mr-1.5" /> 真题例句
                    </h4>
                    <div className="space-y-4">
                        {displayedSentences.map((sent, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/80 transition-colors">
                                <p className="text-slate-800 font-medium leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: sent.en || '' }} />
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm text-slate-500">{sent.zh}</p>
                                    {sent.source && (
                                        <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                            {sent.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {sentences.length > 5 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full mt-4 flex items-center justify-center py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 group"
                        >
                            {isExpanded ? (
                                <>
                                    收起 <ChevronUp className="w-4 h-4 ml-1 group-hover:-translate-y-0.5 transition-transform" />
                                </>
                            ) : (
                                <>
                                    显示更多真题 ({sentences.length - 5} 条) <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
            
            <SourceBadge source="individual" />
        </div>
    );
};

// --- 2. Web Translation Section ---
export const WebTransSection: React.FC<{ webTrans?: WebTransData }> = ({ webTrans }) => {
    // Robust access: Check both dashed and potential underscored keys just in case, though API is usually dashed.
    const items = webTrans?.['web-translation'] || (webTrans as any)?.['web_translation'] || [];
    
    if (items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Network className="w-5 h-5 text-cyan-600" />
                <h3 className="text-lg font-bold text-slate-800">网络释义 (Web Translation)</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {items.slice(0, 20).map((w, idx) => (
                    <div key={idx} className="flex flex-col p-5 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-cyan-200 transition-colors">
                        {/* Header: Key + Audio */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold text-lg text-slate-800">{w.key}</span>
                            {w['key-speech'] && (
                                <button 
                                    className="p-1.5 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
                                    onClick={() => playUrl(`https://dict.youdao.com/dictvoice?audio=${w['key-speech']}`)}
                                    title="播放读音"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Translations List */}
                        <div className="space-y-3">
                            {w.trans?.map((t, tIdx) => (
                                <div key={tIdx} className="flex flex-col gap-1.5 pl-3 border-l-2 border-slate-200/60 hover:border-cyan-300 transition-colors">
                                    {/* Meaning & Field Tag */}
                                    <div className="flex items-start gap-2 flex-wrap">
                                        <span 
                                            className="text-sm font-medium text-slate-700 leading-relaxed" 
                                            dangerouslySetInnerHTML={{ __html: t.value || '' }}
                                        />
                                        {/* Field Tag (e.g. [计算机]) */}
                                        {t.cls?.cl?.[0] && (
                                            <span className="shrink-0 text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 flex items-center h-fit mt-0.5">
                                                <Tag className="w-2.5 h-2.5 mr-1" />
                                                {t.cls.cl[0]}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Summary / Example */}
                                    {t.summary?.line?.[0] && (
                                        <p 
                                            className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100/50"
                                            dangerouslySetInnerHTML={{ __html: t.summary.line[0] || '' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="web_trans" />
        </div>
    );
};

// --- 3. Wikipedia Section ---
export const WikiSection: React.FC<{ wiki?: WikiDigestData }> = ({ wiki }) => {
    const items = wiki?.summarys || [];
    if (items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-800">维基百科 (Wikipedia)</h3>
            </div>
            <div className="space-y-4">
                {items.map((w, idx) => (
                    <div key={idx}>
                        <h4 className="font-bold text-slate-700 mb-2">{w.key}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{w.summary}</p>
                    </div>
                ))}
                {wiki?.source?.url && (
                    <a href={wiki.source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block text-right mt-2">
                        Read more on Wikipedia
                    </a>
                )}
            </div>
            <SourceBadge source="wikipedia_digest" />
        </div>
    );
};
