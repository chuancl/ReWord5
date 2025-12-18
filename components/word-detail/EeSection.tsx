
import React from 'react';
import { Globe } from 'lucide-react';
import { EeData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

interface EeSectionProps {
    ee?: EeData;
}

export const EeSection: React.FC<EeSectionProps> = ({ ee }) => {
    const items = ee?.word?.trs || [];
    if (items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Globe className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">英英释义 (English-English)</h3>
            </div>
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="shrink-0 w-16 text-right">
                            <span className="text-xs font-bold font-serif text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 italic">
                                {item.pos}
                            </span>
                        </div>
                        <ul className="flex-1 list-disc list-outside ml-4 space-y-2 marker:text-slate-300">
                            {item.tr?.map((t, tIdx) => (
                                <li key={tIdx} className="text-sm text-slate-700 leading-relaxed pl-1">
                                    {t.l?.i}
                                    {t['similar-words'] && (
                                        <span className="block text-xs text-slate-400 mt-1">
                                            Synonyms: {t['similar-words'].join(', ')}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <SourceBadge source="ee" />
        </div>
    );
};
