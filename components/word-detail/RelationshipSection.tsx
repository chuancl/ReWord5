
import React from 'react';
import { Layers, Share2, Split, GitBranch, History } from 'lucide-react';
import { PhrsData, SynoData, RelWordData, EtymData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

// --- 1. Phrases ---
export const PhrasesSection: React.FC<{ phrs?: PhrsData }> = ({ phrs }) => {
    const phrases = phrs?.phrs || [];
    if (phrases.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Layers className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-800">常用词组 (Phrases)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phrases.slice(0, 30).map((item, idx) => {
                    const head = item.phr?.headword?.l?.i;
                    const trs = item.phr?.trs || [];
                    const transList: string[] = [];
                    
                    trs.forEach(t => {
                        const trData = t.tr;
                        if (Array.isArray(trData)) {
                            trData.forEach(sub => {
                                if (sub?.l?.i) transList.push(sub.l.i);
                            });
                        } else if (trData?.l?.i) {
                            transList.push(trData.l.i);
                        }
                    });
                    
                    if (!head || transList.length === 0) return null;
                    
                    return (
                        <div key={idx} className="relative p-4 rounded-xl border border-slate-100 hover:border-green-300 hover:shadow-sm hover:bg-green-50/20 transition-all group bg-slate-50/30">
                            <h4 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-green-700 border-b border-slate-100 pb-2">{head}</h4>
                            <div className="space-y-1.5">
                                {transList.map((t, i) => (
                                    <div key={i} className="text-xs text-slate-600 leading-relaxed flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-300 mt-1.5 mr-2 shrink-0 group-hover:bg-green-500 transition-colors"></span>
                                        <span>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <SourceBadge source="phrs" />
        </div>
    );
};

// --- 2. Synonyms ---
export const SynonymsSection: React.FC<{ syno?: SynoData }> = ({ syno }) => {
    const synonyms = syno?.synos || [];
    if (synonyms.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Share2 className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-slate-800">同近义词 (Synonyms)</h3>
            </div>
            <div className="space-y-4">
                {synonyms.map((group, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="shrink-0 sm:w-32 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded italic">{group.syno?.pos || 'N/A'}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{group.syno?.tran}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {group.syno?.ws?.map((w, wIdx) => (
                                <span key={wIdx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-purple-300 hover:text-purple-600 transition cursor-default shadow-sm">
                                    {w.w}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="syno" />
        </div>
    );
};

// --- 3. Discrimination ---
export const DiscrimSection: React.FC<{ discrim?: { discrims?: { title?: string; desc?: string }[] } }> = ({ discrim }) => {
    const discrims = discrim?.discrims || [];
    if (discrims.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Split className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-slate-800">词义辨析 (Discrimination)</h3>
            </div>
            <div className="space-y-6">
                {discrims.map((item, idx) => (
                    <div key={idx} className="group">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></span>
                            {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed pl-3.5 border-l border-slate-200 group-hover:border-orange-200 transition-colors">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
            <SourceBadge source="discrim" />
        </div>
    );
};

// --- 4. Roots ---
export const RootsSection: React.FC<{ relWord?: RelWordData }> = ({ relWord }) => {
    const roots = relWord?.rels || [];
    if (roots.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <GitBranch className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-800">词根词源 (Roots & Cognates)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roots.map((r, idx) => (
                    <div key={idx} className="bg-rose-50/30 rounded-xl p-5 border border-rose-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded">
                                {r.rel?.pos}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {r.rel?.words?.slice(0, 8).map((w, wIdx) => (
                                <div key={wIdx} className="flex justify-between items-baseline text-sm">
                                    <span className="font-bold text-slate-700">{w.word}</span>
                                    <span className="text-slate-500 text-xs">{w.tran}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="rel_word" />
        </div>
    );
};

// --- 5. Etymology ---
export const EtymSection: React.FC<{ etym?: EtymData }> = ({ etym }) => {
    const etymList = etym?.etyms?.zh || etym?.etyms?.en || [];
    if (etymList.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-800">词源典故 (Etymology)</h3>
            </div>
            <div className="space-y-6">
                {etymList.map((item, idx) => (
                    <div key={idx} className="prose prose-sm prose-slate max-w-none bg-amber-50/50 p-6 rounded-xl border border-amber-100 text-slate-700 leading-relaxed font-serif">
                        {item.value && <p className="font-bold text-lg mb-2 text-amber-900">{item.value}</p>}
                        <p>{item.desc}</p>
                        {item.source && <p className="text-xs text-amber-500/60 mt-4 text-right">—— {item.source}</p>}
                    </div>
                ))}
            </div>
            <SourceBadge source="etym" />
        </div>
    );
};

// Fallback for compatibility if imported as default (though we switched to named exports)
export const RelationshipSection: React.FC<any> = (props) => {
    return (
        <div className="space-y-8">
            <PhrasesSection phrs={props.phrs} />
            <SynonymsSection syno={props.syno} />
            <DiscrimSection discrim={props.discrim} />
            <RootsSection relWord={props.relWord} />
            <EtymSection etym={props.etym} />
        </div>
    );
};
