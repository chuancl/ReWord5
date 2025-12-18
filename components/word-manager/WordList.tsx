

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { WordEntry, WordCategory, MergeStrategyConfig } from '../../types';
import { PlayCircle, MapPin, ExternalLink, Filter, BarChart2, Star, Youtube, Image as ImageIcon } from 'lucide-react';
import { playWordAudio, playSentenceAudio } from '../../utils/audio';

interface WordListProps {
    groupedEntries: WordEntry[][];
    selectedWords: Set<string>;
    toggleSelectGroup: (group: WordEntry[]) => void;
    isGroupSelected: (group: WordEntry[]) => boolean;
    showConfig: { showPhonetic: boolean; showMeaning: boolean; };
    mergeConfig: MergeStrategyConfig;
    isAllWordsTab: boolean;
    searchQuery: string;
    ttsSpeed?: number;
}

const InfoTag: React.FC<{ text: string, trans: string }> = ({ text, trans }) => (
    <div className="inline-flex items-center px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mr-2 mb-1 cursor-help hover:border-blue-300 transition" title={trans}>
        <span className="font-medium mr-1">{text}</span>
    </div>
);

export const WordList: React.FC<WordListProps> = ({ 
    groupedEntries, selectedWords, toggleSelectGroup, isGroupSelected,
    showConfig, mergeConfig, searchQuery, ttsSpeed = 1.0 
}) => {
    
    // Image Preview State
    const [previewImage, setPreviewImage] = useState<{ url: string; rect: DOMRect } | null>(null);

    if (groupedEntries.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
             <Filter className="w-12 h-12 text-slate-200 mb-3" />
             <p>{searchQuery ? '无匹配搜索结果' : '暂无符合条件的单词'}</p>
          </div>
        );
    }

    return (
        <div className="space-y-4">
          {groupedEntries.map(group => {
            const primary = group[0];
            const uniqueTranslations = Array.from(new Set(group.map(e => e.translation?.trim()).filter(Boolean)));
            const displayTranslation = uniqueTranslations.join('; ');
            const displayInflections = group.find(e => e.inflections && e.inflections.length > 0)?.inflections;

            return (
              <div key={primary.id} className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-5 flex gap-4 group ${isGroupSelected(group) ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'}`}>
                <div className="pt-1.5">
                    <input type="checkbox" checked={isGroupSelected(group)} onChange={() => toggleSelectGroup(group)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </div>
                <div className="flex-1 space-y-4 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{primary.text}</h3>
                          
                          {mergeConfig.showPartOfSpeech && primary.partOfSpeech && (
                              <span className="font-serif font-bold text-sm text-slate-400 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-100">{primary.partOfSpeech}</span>
                          )}

                          {showConfig.showPhonetic && (primary.phoneticUs || primary.phoneticUk) && (
                            <div className="flex items-center text-sm text-slate-500 space-x-3 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              {primary.phoneticUs && (
                                  <span className="flex items-center cursor-pointer hover:text-blue-600 transition select-none mr-2" title="点击播放美式发音" onClick={(e) => { e.stopPropagation(); playWordAudio(primary.text, 'US', ttsSpeed); }}>
                                      <span className="text-[10px] mr-1 text-slate-400 font-sans">US</span> {primary.phoneticUs} <PlayCircle className="w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-100"/>
                                  </span>
                              )}
                              {primary.phoneticUk && (
                                  <span className="flex items-center cursor-pointer hover:text-blue-600 transition select-none" title="点击播放英式发音" onClick={(e) => { e.stopPropagation(); playWordAudio(primary.text, 'UK', ttsSpeed); }}>
                                      <span className="text-[10px] mr-1 text-slate-400 font-sans">UK</span> {primary.phoneticUk} <PlayCircle className="w-3.5 h-3.5 ml-1 opacity-50 group-hover:opacity-100"/>
                                  </span>
                              )}
                            </div>
                          )}
                          
                          {showConfig.showMeaning && displayTranslation && (
                            <div className="text-slate-700 font-medium px-3 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-100 text-sm">
                              {displayTranslation}
                              {group.length > 1 && mergeConfig.strategy === 'by_word' && (<span className="ml-2 text-xs text-amber-700/60 font-normal">({group.length})</span>)}
                            </div>
                          )}
                      </div>

                      <div className="ml-auto sm:ml-0 self-start sm:self-center flex flex-col items-end gap-1.5">
                           <div className="flex items-center gap-2">
                               <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${primary.category === WordCategory.KnownWord ? 'bg-green-50 text-green-700 border-green-200' : primary.category === WordCategory.WantToLearnWord ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{primary.category}</span>
                               
                               {mergeConfig.showTags && primary.tags && primary.tags.map(tag => (
                                   <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 whitespace-nowrap">{tag}</span>
                               ))}
                           </div>

                           <div className="flex items-center gap-3 text-xs text-slate-400">
                               {mergeConfig.showImportance && primary.importance ? (
                                   <div className="flex" title={`Collins Level ${primary.importance}`}>
                                       {[...Array(5)].map((_, i) => (
                                           <Star key={i} className={`w-3 h-3 ${i < (primary.importance || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                       ))}
                                   </div>
                               ) : null}

                               {mergeConfig.showCocaRank && primary.cocaRank && primary.cocaRank > 0 ? (
                                   <span className="flex items-center" title="COCA 词频排名">
                                       <BarChart2 className="w-3 h-3 mr-1"/> #{primary.cocaRank}
                                   </span>
                               ) : null}
                           </div>
                      </div>
                    </div>
                    
                    {/* Media Row: Image & Video */}
                    {(mergeConfig.showImage || mergeConfig.showVideo) && (primary.image || primary.video) && (
                        <div className="flex gap-4">
                            {mergeConfig.showImage && primary.image && (
                                <div 
                                    className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in relative group/img hover:border-blue-300 transition shrink-0 bg-slate-50 flex items-center justify-center"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPreviewImage({ url: primary.image!, rect });
                                    }}
                                    onMouseLeave={() => setPreviewImage(null)}
                                >
                                    <img src={primary.image} alt={primary.text} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-white drop-shadow-md"/>
                                    </div>
                                </div>
                            )}

                            {mergeConfig.showVideo && primary.video && (
                                <a 
                                    href={primary.video.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-4 hover:bg-slate-100 hover:border-blue-200 transition group/vid max-w-xs"
                                >
                                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                                        {primary.video.cover && <img src={primary.video.cover} className="absolute inset-0 w-full h-full object-cover opacity-60"/>}
                                        <Youtube className="w-5 h-5 text-red-500 relative z-10 drop-shadow-sm"/>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-700 truncate group-hover/vid:text-blue-700">{primary.video.title}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">点击观看讲解视频</div>
                                    </div>
                                </a>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                       {mergeConfig.exampleOrder.filter(item => item.enabled).map(item => {
                          return (
                            <React.Fragment key={item.id}>
                               {/* Inflections */}
                               {item.id === 'inflections' && displayInflections && displayInflections.length > 0 && (
                                   <div key={`${primary.id}-inflections`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                      <div className="absolute left-0 top-3 w-1 h-8 bg-orange-400 rounded-r"></div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">词态变化 (Morphology)</span>
                                      <div className="flex flex-wrap gap-2 pl-2">
                                          {displayInflections.map(inf => (<span key={inf} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 font-mono">{inf}</span>))}
                                      </div>
                                   </div>
                               )}
                               
                               {/* Phrases */}
                               {item.id === 'phrases' && primary.phrases && primary.phrases.length > 0 && (
                                   <div key={`${primary.id}-phrases`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                       <div className="absolute left-0 top-3 w-1 h-8 bg-indigo-500 rounded-r"></div>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">常用短语 (Phrases)</span>
                                       <div className="flex flex-wrap pl-2">
                                           {primary.phrases.map((p, i) => <InfoTag key={i} text={p.text} trans={p.trans} />)}
                                       </div>
                                   </div>
                               )}

                               {/* Roots */}
                               {item.id === 'roots' && primary.roots && primary.roots.length > 0 && (
                                   <div key={`${primary.id}-roots`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                       <div className="absolute left-0 top-3 w-1 h-8 bg-rose-500 rounded-r"></div>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">词根词缀 (Roots)</span>
                                       <div className="space-y-2 pl-2">
                                           {primary.roots.map((r, i) => (
                                               <div key={i} className="flex items-baseline gap-2 text-xs">
                                                   <span className="font-mono font-bold text-slate-500">{r.root}</span>
                                                   <div className="flex flex-wrap flex-1 gap-1">
                                                       {r.words.map((w, j) => <span key={j} className="text-slate-600" title={w.trans}>{w.text}{j < r.words.length - 1 ? ',' : ''}</span>)}
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}

                               {/* Synonyms */}
                               {item.id === 'synonyms' && primary.synonyms && primary.synonyms.length > 0 && (
                                   <div key={`${primary.id}-synonyms`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative">
                                       <div className="absolute left-0 top-3 w-1 h-8 bg-cyan-500 rounded-r"></div>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">近义词 (Synonyms)</span>
                                       <div className="flex flex-wrap pl-2">
                                           {primary.synonyms.map((s, i) => <InfoTag key={i} text={s.text} trans={s.trans} />)}
                                       </div>
                                   </div>
                               )}

                               {/* Examples Iteration (Context, Mixed, Dictionary) */}
                               {group.map((entry, idx) => {
                                  // Skip non-example items in this loop
                                  if (['inflections', 'phrases', 'roots', 'synonyms'].includes(item.id)) return null;
                                  
                                  if (!mergeConfig.showMultiExamples && idx > 0) return null;

                                  if (item.id === 'context' && entry.contextSentence) {
                                    return (
                                      <div key={`${entry.id}-context`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative group/ctx cursor-pointer hover:bg-slate-100 transition" onClick={(e) => { e.stopPropagation(); playSentenceAudio(entry.contextSentence!, undefined, 'US', ttsSpeed); }} title="点击朗读例句">
                                        <div className="absolute left-0 top-3 w-1 h-8 bg-blue-500 rounded-r"></div>
                                        {idx === 0 && <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">来源原句 (Context)</span>}
                                        <p className="text-sm text-slate-700 leading-relaxed pl-2 mb-2">{entry.contextSentence}</p>
                                        {mergeConfig.showContextTranslation && entry.contextSentenceTranslation && (<p className="text-xs text-slate-500 pl-2 mt-1">{entry.contextSentenceTranslation}</p>)}
                                        {entry.sourceUrl && (
                                          <div className="pl-2 mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-3">
                                            <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center text-xs text-blue-600 hover:underline">
                                              <MapPin className="w-3 h-3 mr-1" /> 来源 {group.length > 1 && `#${idx + 1}`} <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                            </a>
                                            <span className="text-[10px] text-slate-400 ml-auto">{new Date(entry.addedAt).toLocaleDateString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  if (item.id === 'mixed' && entry.mixedSentence) {
                                     return (
                                       <div key={`${entry.id}-mixed`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative cursor-pointer hover:bg-slate-100 transition" onClick={(e) => { e.stopPropagation(); playSentenceAudio(entry.mixedSentence!, undefined, 'US', ttsSpeed); }} title="点击朗读例句">
                                          <div className="absolute left-0 top-3 w-1 h-8 bg-purple-500 rounded-r"></div>
                                         {idx === 0 && <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">中英混合 (Mixed)</span>}
                                         <p className="text-sm text-slate-700 leading-relaxed pl-2">{entry.mixedSentence}</p>
                                       </div>
                                     );
                                  }
                                  if (item.id === 'dictionary' && entry.dictionaryExample) {
                                     return (
                                        <div key={`${entry.id}-dictionary`} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 relative cursor-pointer hover:bg-slate-100 transition" onClick={(e) => { e.stopPropagation(); playSentenceAudio(entry.dictionaryExample!, undefined, 'US', ttsSpeed); }} title="点击朗读例句">
                                          <div className="absolute left-0 top-3 w-1 h-8 bg-emerald-500 rounded-r"></div>
                                          {idx === 0 && <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-2">词典例句 (Dictionary)</span>}
                                          <p className="text-sm text-slate-600 italic leading-relaxed pl-2">{entry.dictionaryExample}</p>
                                          {mergeConfig.showExampleTranslation && entry.dictionaryExampleTranslation && (<p className="text-xs text-slate-500 pl-2 mt-1">{entry.dictionaryExampleTranslation}</p>)}
                                        </div>
                                     );
                                  }
                                  return null;
                               })}
                            </React.Fragment>
                          );
                       })}
                    </div>
                </div>
              </div>
            );
          })}

          {/* Portal for Image Preview */}
          {previewImage && createPortal(
              <div 
                  style={{
                      position: 'fixed', 
                      top: previewImage.rect.top - 12, 
                      left: previewImage.rect.left + previewImage.rect.width / 2, 
                      transform: 'translate(-50%, -100%)',
                      zIndex: 999999,
                      pointerEvents: 'none'
                  }}
                  className="animate-in fade-in zoom-in-95 duration-200 filter drop-shadow-xl"
              >
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <img src={previewImage.url} className="max-w-[320px] max-h-[320px] object-cover rounded bg-slate-50" />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white"></div>
              </div>,
              document.body
          )}
        </div>
    );
};