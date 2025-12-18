
import React from 'react';
import { BookOpen } from 'lucide-react';
import { ExpandEcData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

interface ExpandEcSectionProps {
    expandEc?: ExpandEcData;
}

export const ExpandEcSection: React.FC<ExpandEcSectionProps> = ({ expandEc }) => {
    const items = expandEc?.word || [];
    if (items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-800">扩展释义 (Expanded)</h3>
            </div>
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx}>
                        {item.pos && <span className="inline-block mb-2 font-serif font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic text-sm">{item.pos}</span>}
                        <ul className="space-y-3 pl-2">
                            {item.transList?.map((t, tIdx) => (
                                <li key={tIdx} className="group">
                                    <div className="font-medium text-slate-800">{t.trans}</div>
                                    {t.content?.sents?.map((s, sIdx) => (
                                        <div key={sIdx} className="mt-1.5 pl-3 border-l-2 border-slate-200 text-sm text-slate-600 group-hover:border-emerald-300 transition-colors">
                                            <p dangerouslySetInnerHTML={{ __html: s.sentOrig || '' }} />
                                            <p className="text-slate-400 text-xs mt-0.5" dangerouslySetInnerHTML={{ __html: s.sentTrans || '' }} />
                                        </div>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <SourceBadge source="expand_ec" />
        </div>
    );
};
