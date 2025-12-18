
import React from 'react';
import { Volume2 } from 'lucide-react';
import { playWordAudio } from '../../utils/audio';
import { EcData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

interface BasicInfoProps {
    word: string;
    ec?: EcData;
}

export const BasicInfo: React.FC<BasicInfoProps> = ({ word, ec }) => {
    if (!ec) return null;
    const wordInfo = ec.word?.[0];
    const tags = ec.exam_type || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
            <div className="flex flex-col gap-4">
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight font-serif">{word}</h1>
                        <div className="flex gap-3 mb-1.5">
                            {wordInfo?.ukphone && (
                                <div className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group/sound select-none" onClick={() => playWordAudio(word, 'UK')}>
                                    <span className="text-xs font-bold text-slate-400 group-hover/sound:text-blue-500">UK</span>
                                    <span className="font-mono text-sm text-slate-600 group-hover/sound:text-blue-700">/{wordInfo.ukphone}/</span>
                                    <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover/sound:text-blue-600" />
                                </div>
                            )}
                            {wordInfo?.usphone && (
                                <div className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group/sound select-none" onClick={() => playWordAudio(word, 'US')}>
                                    <span className="text-xs font-bold text-slate-400 group-hover/sound:text-blue-500">US</span>
                                    <span className="font-mono text-sm text-slate-600 group-hover/sound:text-blue-700">/{wordInfo.usphone}/</span>
                                    <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover/sound:text-blue-600" />
                                </div>
                            )}
                        </div>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-500 shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* WFS (Word Forms) Section */}
                    {wordInfo?.wfs && wordInfo.wfs.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5 text-sm">
                            {wordInfo.wfs.map((item, i) => (
                                <div key={i} className="flex items-center text-slate-600 bg-slate-100/50 px-2 py-1 rounded border border-slate-200/50">
                                    <span className="text-slate-400 mr-1.5 text-xs scale-90 origin-right">{item.wf?.name}</span>
                                    <span className="font-semibold text-slate-700">{item.wf?.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        {wordInfo?.trs?.map((trWrapper, idx) => {
                            const def = trWrapper.tr?.[0]?.l?.i?.[0];
                            if (!def) return null;
                            const match = def.match(/^([a-z]+\.)\s*(.*)/);
                            return (
                                <div key={idx} className="flex items-start gap-3 text-lg text-slate-700">
                                    {match ? (
                                        <>
                                            <span className="font-serif font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-base italic min-w-[3rem] text-center">{match[1]}</span>
                                            <span className="font-medium pt-0.5">{match[2]}</span>
                                        </>
                                    ) : (
                                        <span className="font-medium">{def}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <SourceBadge source="ec" />
            </div>
        </div>
    );
};
