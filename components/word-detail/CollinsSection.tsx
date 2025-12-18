
import React from 'react';
import { Star, Volume2 } from 'lucide-react';
import { CollinsData, CollinsPrimaryData } from '../../types/youdao';
import { playUrl } from '../../utils/audio';
import { SourceBadge } from './SourceBadge';

const toArray = <T,>(candidate: T | T[] | undefined | null): T[] => {
    if (candidate === undefined || candidate === null) return [];
    return Array.isArray(candidate) ? candidate : [candidate];
};

// --- 1. Collins Primary (New) ---
export const CollinsPrimarySection: React.FC<{ collinsPrimary?: CollinsPrimaryData, oldStar?: number }> = ({ collinsPrimary, oldStar }) => {
    const primaryData = collinsPrimary?.gramcat || [];
    if (primaryData.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50/50 px-8 py-5 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-amber-900 flex items-center text-lg">
                    <Star className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
                    柯林斯双解 (新)
                </h3>
                {oldStar !== undefined && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-amber-100 shadow-sm">
                        <span className="text-xs font-bold text-amber-800 mr-2 uppercase">Level</span>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < oldStar ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-8 space-y-8">
                {primaryData.map((cat, cIdx) => (
                    <div key={cIdx}>
                        <div className="flex items-center gap-3 mb-4">
                            {cat.partofspeech && (
                                <div className="text-sm font-bold text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded border border-amber-100">
                                    {cat.partofspeech}
                                </div>
                            )}
                            {cat.audiourl && (
                                <button 
                                    onClick={() => playUrl(cat.audiourl!)}
                                    className="p-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                                    title="Play Collins Audio"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-6">
                            {cat.senses?.map((sense, sIdx) => (
                                <div key={sIdx} className="flex gap-4 group">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">{sIdx + 1}</div>
                                    <div className="flex-1">
                                        <div className="text-slate-800 font-medium mb-1">
                                            {sense.word && <span className="mr-2 text-amber-900 font-bold">{sense.word}</span>}
                                            {sense.definition}
                                        </div>
                                        {sense.examples && (
                                            <div className="space-y-1 mt-2">
                                                {sense.examples.map((ex, exIdx) => (
                                                    <div key={exIdx} className="text-sm text-slate-600 pl-3 border-l-2 border-slate-200">
                                                        <p>{ex.example}</p>
                                                        {(ex.sense?.word || ex.tran) && (
                                                            <p className="text-slate-400 text-xs mt-0.5">
                                                                {ex.sense?.word || ex.tran}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="collins_primary" />
        </div>
    );
};

// --- 2. Collins Old ---
export const CollinsOldSection: React.FC<{ collinsOld?: CollinsData, word: string }> = ({ collinsOld, word }) => {
    const oldEntries = collinsOld?.collins_entries || [];
    if (oldEntries.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50/50 px-8 py-5 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-amber-900 flex items-center text-lg">
                    <Star className="w-5 h-5 mr-2 text-amber-500" />
                    柯林斯双解 (旧)
                </h3>
            </div>

            <div className="p-8">
                {oldEntries.map((entryGroup, groupIdx) => (
                    <div key={groupIdx} className="mb-10 last:mb-0">
                        <div className="flex items-center justify-between mb-4 bg-amber-50/30 p-3 rounded-lg border border-amber-100">
                            <div className="flex items-baseline gap-3">
                                <span className="font-bold text-amber-900 text-xl">{entryGroup.headword || word}</span>
                                {oldEntries.length > 1 && (
                                    <span className="text-xs text-amber-700/60 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-amber-100">Definition Group {groupIdx + 1}</span>
                                )}
                            </div>
                            {entryGroup.star !== undefined && (
                                <div className="flex items-center bg-white px-3 py-1 rounded-full border border-amber-100 shadow-sm">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (entryGroup.star || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="divide-y divide-slate-100">
                            {toArray(entryGroup.entries?.entry).map((entry, eIdx) => (
                                <div key={eIdx}>
                                    {toArray(entry.tran_entry).map((te, tIdx) => (
                                        <div key={tIdx} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    {tIdx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    {te.pos_entry && (
                                                        <div className="mb-1">
                                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mr-2">{te.pos_entry.pos}</span>
                                                            {te.pos_entry.pos_tips && <span className="text-xs text-slate-400">({te.pos_entry.pos_tips})</span>}
                                                        </div>
                                                    )}
                                                    <div className="mb-2 text-slate-800 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: te.tran || '' }} />
                                                    {te.exam_sents && (
                                                        <div className="space-y-2 pl-3 border-l-2 border-slate-200 mt-2">
                                                            {toArray(te.exam_sents).slice(0, 3).map((ex, exIdx) => (
                                                                <div key={exIdx} className="text-sm group/ex">
                                                                    <p className="text-slate-700 font-medium group-hover/ex:text-blue-700 transition-colors cursor-text">{ex.sent_orig}</p>
                                                                    <p className="text-slate-400 text-xs mt-0.5">{ex.sent_trans}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="collins" />
        </div>
    );
};

// Compatibility export
export const CollinsSection: React.FC<any> = ({ word, collinsPrimary, collinsOld }) => (
    <div className="space-y-8">
        <CollinsPrimarySection collinsPrimary={collinsPrimary} oldStar={collinsOld?.collins_entries?.[0]?.star} />
        <CollinsOldSection collinsOld={collinsOld} word={word} />
    </div>
);
