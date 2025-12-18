
import React from 'react';
import { Briefcase, Book, Quote } from 'lucide-react';
import { SpecialData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

export const SpecialSection: React.FC<{ special?: SpecialData }> = ({ special }) => {
    const entries = special?.entries || [];
    if (entries.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">专业释义 (Specialized)</h3>
            </div>
            
            <div className="space-y-8">
                {entries.map((item, idx) => {
                    const major = item.entry?.major;
                    const trs = item.entry?.trs || [];
                    
                    if (!major || trs.length === 0) return null;

                    return (
                        <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                            {/* Header: Field/Domain */}
                            <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white bg-indigo-500 shadow-sm">
                                    {major}
                                </span>
                            </div>

                            {/* Translations List */}
                            <div className="space-y-4">
                                {trs.map((tItem, tIdx) => {
                                    const tr = tItem.tr;
                                    if (!tr) return null;

                                    return (
                                        <div key={tIdx} className="bg-white p-4 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                                            {/* Term Translation */}
                                            {tr.nat && (
                                                <div className="text-base font-bold text-slate-800 mb-2">
                                                    {tr.nat}
                                                </div>
                                            )}

                                            {/* Example Sentence */}
                                            {(tr.engSent || tr.chnSent) && (
                                                <div className="mb-3 pl-3 border-l-2 border-slate-200">
                                                    {tr.engSent && <p className="text-sm text-slate-700 mb-1" dangerouslySetInnerHTML={{ __html: tr.engSent }} />}
                                                    {tr.chnSent && <p className="text-xs text-slate-500">{tr.chnSent}</p>}
                                                </div>
                                            )}

                                            {/* Source Document */}
                                            {tr.docTitle && (
                                                <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-50">
                                                    <Book className="w-3 h-3 text-slate-400 mr-1.5" />
                                                    <span className="text-[10px] text-slate-400 italic truncate max-w-full">
                                                        {tr.docTitle}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <SourceBadge source="special" />
        </div>
    );
};
