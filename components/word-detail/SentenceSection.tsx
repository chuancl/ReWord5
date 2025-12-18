
import React from 'react';
import { Quote, Volume2 } from 'lucide-react';
import { BilingualSentenceData, MediaSentsPartData } from '../../types/youdao';
import { playUrl } from '../../utils/audio';
import { SourceBadge } from './SourceBadge';

// --- 1. Bilingual Sentences ---
export const BilingualSentencesSection: React.FC<{ bilingual?: BilingualSentenceData }> = ({ bilingual }) => {
    const sentences = bilingual?.["sentence-pair"] || [];
    if (sentences.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Quote className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-slate-800">双语例句 (Bilingual Sentences)</h3>
            </div>
            <div className="space-y-4">
                {sentences.slice(0, 8).map((s, idx) => (
                    <div key={idx} className="group cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100" onClick={() => s["sentence-speech"] && playUrl(`https://dict.youdao.com/dictvoice?audio=${s["sentence-speech"]}`)}>
                        <div className="flex gap-4">
                            <div className="mt-1 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-base text-slate-800 mb-1.5 group-hover:text-blue-700 transition-colors leading-relaxed" dangerouslySetInnerHTML={{ __html: s["sentence-eng"] || '' }} />
                                <p className="text-sm text-slate-500">{s["sentence-translation"]}</p>
                            </div>
                            {s["sentence-speech"] && <Volume2 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5" />}
                        </div>
                    </div>
                ))}
            </div>
            <SourceBadge source="blng_sents_part" />
        </div>
    );
};

// --- 2. Media Sentences ---
export const MediaSentencesSection: React.FC<{ media?: MediaSentsPartData }> = ({ media }) => {
    const mediaSents = media?.sent || [];
    if (mediaSents.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Volume2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-800">原声例句 (Media Sentences)</h3>
            </div>
            <div className="space-y-4">
                {mediaSents.map((s, idx) => (
                    <div key={idx} className="bg-teal-50/30 p-4 rounded-xl border border-teal-100">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <p className="text-slate-800 mb-1" dangerouslySetInnerHTML={{ __html: s.eng || '' }} />
                                <p className="text-sm text-slate-500">{s.chn}</p>
                            </div>
                        </div>
                        {s.snippets?.snippet && s.snippets.snippet.length > 0 && (
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400">来源: {s.snippets.snippet[0].source}</span>
                                {s.snippets.snippet[0].streamUrl && (
                                    <button 
                                        className="p-1.5 bg-teal-100 text-teal-600 rounded-full hover:bg-teal-200 transition"
                                        onClick={() => playUrl(s.snippets!.snippet![0].streamUrl!)}
                                    >
                                        <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <SourceBadge source="media_sents_part" />
        </div>
    );
};

// Compatibility export
export const SentenceSection: React.FC<any> = ({ bilingual, media }) => (
    <div className="space-y-8">
        <BilingualSentencesSection bilingual={bilingual} />
        <MediaSentencesSection media={media} />
    </div>
);
