
import React, { useState, useMemo } from 'react';
import { AnkiConfig, WordEntry, WordCategory } from '../../types';
import { RefreshCw, Wifi, Info, PlusCircle, Layers, Calendar, Code, Eye, BookOpen, X, Copy, Lock, Unlock, AlertCircle } from 'lucide-react';
import { pingAnki, addNotesToAnki, getCardsInfo, getModelNames, createModel, createDeck, getDeckNames, canAddNotes } from '../../utils/anki-client';
import { Toast, ToastMessage } from '../ui/Toast';
import { SyncStatusModal } from './SyncStatusModal';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative inline-flex items-center ml-1 align-middle">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl w-max max-w-[240px] leading-relaxed whitespace-normal text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

interface AnkiSectionProps {
  config: AnkiConfig;
  setConfig: React.Dispatch<React.SetStateAction<AnkiConfig>>;
  entries: WordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<WordEntry[]>>;
}

export const AnkiSection: React.FC<AnkiSectionProps> = ({ config, setConfig, entries, setEntries }) => {
  const [activeTemplate, setActiveTemplate] = useState<'front' | 'back'>('front');
  const [showVarHelp, setShowVarHelp] = useState(false);
  
  // Status States
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'processing' | 'success' | 'fail'>('idle');
  const [progressStatus, setProgressStatus] = useState<'idle' | 'processing' | 'success' | 'fail' | 'warning'>('idle');
  
  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncCandidates, setSyncCandidates] = useState<WordEntry[]>([]);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Deck Name Unlock Logic (Easter Egg) - Independent counters
  const [wantUnlockCount, setWantUnlockCount] = useState(0);
  const [learningUnlockCount, setLearningUnlockCount] = useState(0);

  const isWantUnlocked = wantUnlockCount >= 6;
  const isLearningUnlocked = learningUnlockCount >= 6;

  const handleWantInputClick = () => {
      if (!isWantUnlocked) {
          const newCount = wantUnlockCount + 1;
          setWantUnlockCount(newCount);
          if (newCount === 6) {
              showToast("已解锁“想学习”牌组名称编辑", "success");
          }
      }
  };

  const handleLearningInputClick = () => {
      if (!isLearningUnlocked) {
          const newCount = learningUnlockCount + 1;
          setLearningUnlockCount(newCount);
          if (newCount === 6) {
              showToast("已解锁“正在学”牌组名称编辑", "success");
          }
      }
  };

  // Mock Data for Preview with ALL Rich Fields
  const previewEntry = useMemo<WordEntry>(() => ({
      id: 'preview-mock',
      text: 'serendipity',
      phoneticUs: '/ˌsɛrənˈdɪpɪti/',
      phoneticUk: '/ˌsɛrənˈdɪpɪti/',
      translation: '意外发现珍奇事物的本领；机缘凑巧',
      englishDefinition: 'The occurrence and development of events by chance in a happy or beneficial way.',
      partOfSpeech: 'n.',
      
      // Context Data
      contextParagraph: '许多科学发现都是机缘巧合的结果。青霉素的发现是一个改变医学进程的令人高兴的 serendipity (意外机缘)。',
      contextParagraphTranslation: 'Many scientific discoveries are a result of serendipity. The discovery of penicillin was a happy serendipity that changed the course of medicine.',
      
      contextSentence: '青霉素的发现是一个改变医学进程的令人高兴的 serendipity (意外机缘)。',
      contextSentenceTranslation: 'The discovery of penicillin was a happy serendipity that changed the course of medicine.',
      
      mixedSentence: 'The discovery of penicillin was a happy serendipity (意外机缘).',
      
      dictionaryExample: 'Nature has created wonderful things by serendipity.',
      dictionaryExampleTranslation: '大自然通过机缘巧合创造了奇妙的事物。',
      
      sourceUrl: 'https://en.wikipedia.org/wiki/Serendipity',
      category: WordCategory.WantToLearnWord,
      addedAt: Date.now(),
      tags: ['CET6', 'GRE', 'Science'],
      importance: 4,
      cocaRank: 12500,
      
      inflections: ['serendipities'],
      roots: [{ root: 'serendip', words: [{ text: 'serendipitous', trans: '偶然的' }] }],
      synonyms: [{ text: 'chance', trans: '机会' }, { text: 'fluke', trans: '侥幸' }],
      phrases: [{ text: 'pure serendipity', trans: '纯属巧合' }],
      
      video: {
          title: 'Serendipity Explanation',
          url: 'https://ydlunacommon-cdn.nosdn.127.net/707140effb8842f6dd130f9bb8ba37fb.mp4',
          cover: ''
      },
      image: 'https://ydlunacommon-cdn.nosdn.127.net/10ae64ad2996bb0f48e0ad50a2c5c39e.jpg'
  }), []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  const getButtonClass = (status: string, extraClasses: string = '') => {
      const base = "rounded-lg text-sm font-bold flex items-center justify-center transition border shadow-sm h-[38px] px-4 whitespace-nowrap";
      switch (status) {
          case 'success': return `${base} bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-emerald-200 ${extraClasses}`;
          case 'warning': return `${base} bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-amber-200 ${extraClasses}`;
          case 'fail': return `${base} bg-red-600 text-white hover:bg-red-700 border-transparent shadow-red-200 ${extraClasses}`;
          case 'processing':
          case 'testing': return `${base} bg-blue-600 text-white opacity-80 cursor-wait border-transparent ${extraClasses}`;
      }
      return `${base} bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-blue-200 ${extraClasses}`;
  };

  const handleTestConnection = async () => {
      setConnectionStatus('testing');
      try {
          const ver = await pingAnki(config.url);
          setConnectionStatus('success');
          showToast(`连接成功 (AnkiConnect v${ver})`, 'success');
      } catch (e: any) {
          console.error(e);
          setConnectionStatus('fail');
          showToast(`连接失败: ${e.message}`, 'error');
      }
  };

  const generateCardContent = (entry: WordEntry, template: string) => {
      let content = template;
      
      const generateListHtml = (items: {text: string, trans: string}[], title: string) => {
          if (!items || items.length === 0) return '';
          return `<div class="info-list"><b>${title}:</b> <ul>${items.map(i => `<li>${i.text} <span style="opacity:0.7">(${i.trans})</span></li>`).join('')}</ul></div>`;
      };
      const generateRootsHtml = (roots: any[]) => {
          if (!roots || roots.length === 0) return '';
          return `<div class="info-list"><b>词根:</b> <ul>${roots.map(r => `<li><b>${r.root}</b>: ${r.words.map((w:any) => w.text).join(', ')}</li>`).join('')}</ul></div>`;
      };

      const splitAroundWord = (fullText: string, word: string) => {
          if (!fullText) return { a: '', e: '' };
          const idx = fullText.toLowerCase().indexOf(word.toLowerCase());
          if (idx === -1) return { a: fullText, e: '' };
          return { a: fullText.substring(0, idx), e: fullText.substring(idx + word.length) };
      };

      const sEnSplit = splitAroundWord(entry.contextSentenceTranslation || '', entry.text);
      const pEnSplit = splitAroundWord(entry.contextParagraphTranslation || '', entry.text);

      const audioUsUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(entry.text || '')}&type=2`;
      const audioUkUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(entry.text || '')}&type=1`;
      
      const speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;

      const generateAudioHtml = (url: string) => {
          return `<span class="audio-btn" style="cursor:pointer; margin-left:4px; vertical-align:middle; color:#3b82f6; display:inline-flex; align-items:center;" onclick="var a=this.querySelector('audio'); if(a){a.currentTime=0;a.play();} event.preventDefault(); event.stopPropagation();" title="点击播放">${speakerIcon}<audio src="${url}" preload="auto"></audio></span>`;
      };
      
      const map: Record<string, string> = {
          '{{word}}': entry.text,
          '{{phonetic_us}}': entry.phoneticUs || '',
          '{{phonetic_uk}}': entry.phoneticUk || '',
          '{{audio_us}}': generateAudioHtml(audioUsUrl),
          '{{audio_uk}}': generateAudioHtml(audioUkUrl),
          '{{def_cn}}': entry.translation || '',
          '{{context_meaning}}': entry.translation || '',
          '{{part_of_speech}}': entry.partOfSpeech || '',
          '{{tags}}': (entry.tags || []).join(', '),
          '{{collins_star}}': entry.importance ? '★'.repeat(entry.importance) : '',
          '{{coca_rank}}': entry.cocaRank ? `#${entry.cocaRank}` : '',
          '{{dict_example}}': entry.dictionaryExample || '',
          '{{dict_example_trans}}': entry.dictionaryExampleTranslation || '',
          '{{sentence_en}}': entry.contextSentenceTranslation || '',
          '{{sentence_en_prefix}}': sEnSplit.a,
          '{{sentence_en_suffix}}': sEnSplit.e,
          '{{paragraph_en}}': entry.contextParagraphTranslation || '',
          '{{paragraph_en_prefix}}': pEnSplit.a,
          '{{paragraph_en_suffix}}': pEnSplit.e,
          '{{sentence_src}}': entry.contextSentence || '',
          '{{paragraph_src}}': entry.contextParagraph || '',
          '{{roots}}': generateRootsHtml(entry.roots || []),
          '{{synonyms}}': generateListHtml(entry.synonyms || [], '近义词'),
          '{{phrases}}': generateListHtml(entry.phrases || [], '短语'),
          '{{inflections}}': (entry.inflections || []).join(', '),
          '{{image}}': entry.image ? `<img src="${entry.image}">` : '',
          '{{video}}': entry.video ? `<video src="${entry.video.url}" controls></video>` : '',
      };

      const keys = Object.keys(map).sort((a,b) => b.length - a.length);
      keys.forEach(key => {
          content = content.replace(new RegExp(key, 'g'), map[key]);
      });
      return content;
  };

  const handleAddCards = async () => {
      if (!config.deckNameWant || !config.deckNameLearning) {
          showToast("请先配置完整的牌组名称", "error");
          return;
      }
      if (config.deckNameWant === config.deckNameLearning) {
          showToast("两个牌组名称不能相同", "error");
          return;
      }

      setSyncStatus('processing');
      try {
          const wantWords = entries.filter(e => e.category === WordCategory.WantToLearnWord);
          const learningWords = entries.filter(e => e.category === WordCategory.LearningWord);

          if (wantWords.length === 0 && learningWords.length === 0) {
              setSyncStatus('idle'); 
              showToast(`当前词汇表中没有单词`, "info");
              return;
          }

          const TARGET_MODEL_NAME = "ContextLingo-Basic";
          
          const [existingModels, existingDecks] = await Promise.all([
              getModelNames(config.url),
              getDeckNames(config.url)
          ]);

          if (!existingModels.includes(TARGET_MODEL_NAME)) {
              await createModel(TARGET_MODEL_NAME, config.url);
              setConfig(prev => ({ ...prev, modelName: TARGET_MODEL_NAME }));
          }

          const decksToCreate = [];
          if (!existingDecks.includes(config.deckNameWant)) decksToCreate.push(createDeck(config.deckNameWant, config.url));
          if (!existingDecks.includes(config.deckNameLearning)) decksToCreate.push(createDeck(config.deckNameLearning, config.url));
          
          if (decksToCreate.length > 0) {
              await Promise.all(decksToCreate);
          }

          const processBatch = async (words: WordEntry[], deckName: string) => {
              if (words.length === 0) return { added: 0, skipped: 0 };

              const notesPayload = words.map(entry => ({
                  deckName: deckName,
                  modelName: TARGET_MODEL_NAME, 
                  fields: {
                      Front: generateCardContent(entry, config.templates.frontTemplate),
                      Back: generateCardContent(entry, config.templates.backTemplate)
                  },
                  tags: ['ContextLingo', ...(entry.tags || [])],
                  options: { allowDuplicate: false, duplicateScope: "deck" }
              }));

              const canAddResults = await canAddNotes(notesPayload, config.url);
              const notesToActuallyAdd = notesPayload.filter((_, index) => canAddResults[index]);
              const skippedCount = notesPayload.length - notesToActuallyAdd.length;

              if (notesToActuallyAdd.length > 0) {
                  await addNotesToAnki(notesToActuallyAdd, config.url);
                  return { added: notesToActuallyAdd.length, skipped: skippedCount };
              }
              return { added: 0, skipped: skippedCount };
          };

          const [wantResult, learningResult] = await Promise.all([
              processBatch(wantWords, config.deckNameWant),
              processBatch(learningWords, config.deckNameLearning)
          ]);

          const totalAdded = wantResult.added + learningResult.added;
          const totalSkipped = wantResult.skipped + learningResult.skipped;
          
          setSyncStatus('success');
          showToast(`同步完成: 新增 ${totalAdded} (想学${wantResult.added}/正在学${learningResult.added}), 跳过 ${totalSkipped}`, 'success');

      } catch (e: any) {
          console.error(e);
          setSyncStatus('fail');
          showToast(`同步失败: ${e.message}`, 'error');
      }
  };

  const handleSyncProgress = async () => {
      setProgressStatus('processing');
      try {
          // 1. Prepare queries for BOTH decks
          const wantQuery = `deck:"${config.deckNameWant}" is:review prop:ivl>=${config.syncInterval}`;
          const learningQuery = `deck:"${config.deckNameLearning}" is:review prop:ivl>=${config.syncInterval}`;
          
          // 2. Execute parallel requests
          const [wantCards, learningCards] = await Promise.all([
              getCardsInfo(wantQuery, config.url),
              getCardsInfo(learningQuery, config.url)
          ]);
          
          const allCards = [...wantCards, ...learningCards];

          if (allCards.length === 0) {
              setProgressStatus('warning'); // Use warning for "No data found"
              showToast("在目标牌组中未发现满足自动掌握条件的单词", "info");
              return;
          }

          const stripHtml = (html: string) => {
             const div = document.createElement("div");
             div.innerHTML = html;
             return div.textContent || div.innerText || "";
          };
          
          const candidates: WordEntry[] = [];
          
          // 3. Match logic: Check local words against the fetched Anki cards
          // We check WantToLearn entries against WantCards, and Learning entries against LearningCards
          
          const checkMatches = (entriesList: WordEntry[], ankiCards: any[]) => {
              entriesList.forEach(entry => {
                  const isMastered = ankiCards.some(card => {
                      const frontRaw = card.fields?.Front?.value || "";
                      const frontText = stripHtml(frontRaw);
                      // Basic check: does card front contain the word text?
                      return frontText.includes(entry.text); 
                  });
                  if (isMastered) {
                      candidates.push(entry);
                  }
              });
          };

          // Filter local lists
          const localWant = entries.filter(e => e.category === WordCategory.WantToLearnWord);
          const localLearning = entries.filter(e => e.category === WordCategory.LearningWord);

          // Perform matching
          checkMatches(localWant, wantCards);
          checkMatches(localLearning, learningCards);
          
          if (candidates.length > 0) {
              setSyncCandidates(candidates);
              setIsSyncModalOpen(true);
              setProgressStatus('success');
          } else {
              setProgressStatus('warning'); // Use warning if cards found in Anki but don't match local words
              showToast("没有单词需要更新状态 (本地列表与Anki匹配项为空)", "info");
          }
      } catch (e: any) {
          console.error(e);
          setProgressStatus('fail');
          showToast(`获取进度失败: ${e.message}`, 'error');
      }
  };

  const handleApplySync = (selectedIds: string[]) => {
      if (selectedIds.length === 0) return;
      
      const newEntries = entries.map(entry => {
          if (selectedIds.includes(entry.id)) {
              return { ...entry, category: WordCategory.KnownWord };
          }
          return entry;
      });
      
      setEntries(newEntries);
      setIsSyncModalOpen(false);
      showToast(`同步完成: ${selectedIds.length} 个单词已移入“已掌握”`, 'success');
  };

  const variables = [
     { code: '{{word}}', desc: '英文单词' },
     { code: '{{phonetic_us}}', desc: '美式音标' },
     { code: '{{phonetic_uk}}', desc: '英式音标' },
     { code: '{{audio_us}}', desc: '美式发音 (包含音频标签的按钮)' },
     { code: '{{audio_uk}}', desc: '英式发音 (包含音频标签的按钮)' },
     { code: '{{def_cn}}', desc: '单词中文释义' },
     { code: '{{context_meaning}}', desc: '单词在中文原文中的含义' },
     { code: '{{dict_example}}', desc: '英文例句' },
     { code: '{{dict_example_trans}}', desc: '英文例句翻译' },
     { code: '{{image}}', desc: '单词图片 (IMG标签)' },
     { code: '{{video}}', desc: '视频讲解 (VIDEO标签)' },
     
     { code: '{{sentence_en}}', desc: '句子(API翻译后英文)' },
     { code: '{{sentence_en_prefix}}', desc: '句子前半部分 (译文)' },
     { code: '{{sentence_en_suffix}}', desc: '句子后半部分 (译文)' },
     
     { code: '{{paragraph_en}}', desc: '段落(API翻译后英文)' },
     { code: '{{paragraph_en_prefix}}', desc: '段落前半部分 (译文)' },
     { code: '{{paragraph_en_suffix}}', desc: '段落后半部分 (译文)' },
     
     { code: '{{sentence_src}}', desc: '句子(中文原文)' },
     { code: '{{paragraph_src}}', desc: '段落(中文原文)' },
     
     { code: '{{roots}}', desc: '同根词 (列表HTML)' },
     { code: '{{synonyms}}', desc: '近义词 (列表HTML)' },
     { code: '{{phrases}}', desc: '常用短语 (列表HTML)' },
     { code: '{{inflections}}', desc: '词态变化' },
     { code: '{{part_of_speech}}', desc: '词性' },
     { code: '{{collins_star}}', desc: '柯林斯星级' },
     { code: '{{coca_rank}}', desc: 'COCA排名' },
     { code: '{{tags}}', desc: '单词等级标签' },
  ];

  const handleCopyVar = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast(`已复制: ${text}`, 'success');
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 relative">
        <Toast toast={toast} onClose={() => setToast(null)} />
        
        {/* Sync Status Confirmation Modal - Condition Render to prevent hook error and ensure fresh state */}
        {isSyncModalOpen && (
            <SyncStatusModal 
                isOpen={isSyncModalOpen} 
                onClose={() => setIsSyncModalOpen(false)}
                candidates={syncCandidates}
                onConfirm={handleApplySync}
            />
        )}
        
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Anki 集成</h2>
            <p className="text-sm text-slate-500">配置 AnkiConnect 连接，自定义卡片模板并预览真实效果。</p>
        </div>
        
        <div className="p-6 space-y-8">
           {/* 1. Connection & Settings */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-12 flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">AnkiConnect 地址</label>
                      <input 
                        type="text" 
                        value={config.url}
                        onChange={e => setConfig({...config, url: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="http://127.0.0.1:8765"
                      />
                   </div>
                   <button onClick={handleTestConnection} className={getButtonClass(connectionStatus, "mt-5")}>
                       {connectionStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <Wifi className="w-4 h-4 mr-2"/>}
                       测试连接
                   </button>
               </div>
               
               {/* Export Settings */}
               <div className="lg:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
                   <div className="flex items-center">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center mr-2">
                            <Layers className="w-4 h-4 mr-2 text-blue-600" />新增牌组 (Export)
                        </h3>
                        <Tooltip text="将单词分别导出到 Anki。两个牌组名称不可相同。连续点击输入框 6 次可解锁编辑。">
                            <Info className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
                        </Tooltip>
                   </div>
                   
                   {/* Single Row for Inputs and Button */}
                   <div className="flex items-end gap-3">
                       {/* Deck 1 */}
                       <div className="flex-1">
                           <label className="block text-xs text-slate-500 mb-1">目标牌组（想学习）</label>
                           <div className="relative">
                               <input 
                                    type="text" 
                                    value={config.deckNameWant} 
                                    readOnly={!isWantUnlocked}
                                    onClick={handleWantInputClick}
                                    onChange={e => setConfig({...config, deckNameWant: e.target.value})} 
                                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${isWantUnlocked ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-pointer hover:bg-slate-50'}`}
                                    placeholder="ContextLingo-Want"
                               />
                               {!isWantUnlocked && <Lock className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />}
                               {isWantUnlocked && <Unlock className="w-3 h-3 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                           </div>
                       </div>

                       {/* Deck 2 */}
                       <div className="flex-1">
                           <label className="block text-xs text-slate-500 mb-1">目标牌组（正在学）</label>
                           <div className="relative">
                                <input 
                                    type="text" 
                                    value={config.deckNameLearning} 
                                    readOnly={!isLearningUnlocked}
                                    onClick={handleLearningInputClick}
                                    onChange={e => setConfig({...config, deckNameLearning: e.target.value})} 
                                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${isLearningUnlocked ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-pointer hover:bg-slate-50'}`}
                                    placeholder="ContextLingo-Learning"
                                />
                                {!isLearningUnlocked && <Lock className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />}
                                {isLearningUnlocked && <Unlock className="w-3 h-3 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                           </div>
                       </div>
                       
                       <button onClick={handleAddCards} disabled={syncStatus === 'processing'} className={getButtonClass(syncStatus, "h-[38px]")}>
                           {syncStatus === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <PlusCircle className="w-4 h-4 mr-2"/>} 新增
                       </button>
                   </div>
               </div>

               {/* Sync Settings */}
               <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
                   <div className="flex items-center">
                       <h3 className="font-bold text-slate-800 text-sm flex items-center mr-2">
                           <Calendar className="w-4 h-4 mr-2 text-green-600" />进度同步
                       </h3>
                       <Tooltip text="当 Anki 中的卡片复习间隔大于指定天数时，自动将该单词状态设为“已掌握”。">
                           <Info className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
                       </Tooltip>
                   </div>

                   <div className="flex items-end gap-3 h-full">
                       {/* Days Input */}
                       <div>
                           <label className="block text-xs text-slate-500 mb-1">自动掌握(天)</label>
                           <input 
                                type="number" 
                                value={config.syncInterval} 
                                onChange={e => setConfig({...config, syncInterval: parseInt(e.target.value)})} 
                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm text-center bg-white h-[38px]"
                           />
                       </div>

                       {/* Auto Sync Toggle - Inline Block Style */}
                       <div className="h-[38px] flex items-center bg-white px-3 border border-slate-300 rounded-lg">
                           <label className="text-xs text-slate-600 mr-2 cursor-pointer select-none" htmlFor="auto-sync-toggle">自动同步</label>
                           <label className="relative inline-flex items-center cursor-pointer" id="auto-sync-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.autoSync || false} 
                                    onChange={e => setConfig({...config, autoSync: e.target.checked})} 
                                    className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                           </label>
                       </div>

                       {/* Fetch Button */}
                       <button onClick={handleSyncProgress} disabled={progressStatus === 'processing'} className={getButtonClass(progressStatus, "flex-1 h-[38px]")}>
                           {progressStatus === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : progressStatus === 'warning' ? <AlertCircle className="w-4 h-4 mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>} 获取状态
                       </button>
                   </div>
               </div>
           </div>
           
           <hr className="border-slate-100" />

           {/* 2. & 3. Split Layout for Editor and Preview */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Template Editor */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 h-[42px]">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center">
                            <Code className="w-4 h-4 mr-2 text-slate-500"/> 
                            卡片模板编辑器
                        </h3>
                        <button 
                            onClick={() => setShowVarHelp(true)}
                            className="flex items-center text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm shadow-blue-200 transition"
                        >
                            <BookOpen className="w-4 h-4 mr-2"/> 变量参考
                        </button>
                    </div>

                    <div className="flex flex-col bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex-1 min-h-[500px]">
                        <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1">
                            <button 
                                onClick={() => setActiveTemplate('front')}
                                className={`px-6 py-2 text-xs font-bold rounded-lg transition ${activeTemplate === 'front' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                正面 (Front)
                            </button>
                            <button 
                                onClick={() => setActiveTemplate('back')}
                                className={`px-6 py-2 text-xs font-bold rounded-lg transition ${activeTemplate === 'back' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                背面 (Back)
                            </button>
                        </div>
                        <div className="flex-1 relative group">
                            <textarea 
                                className="w-full h-full p-4 font-mono text-sm text-slate-800 bg-white resize-none focus:outline-none focus:bg-slate-50/30 transition-colors leading-relaxed"
                                value={activeTemplate === 'front' ? config.templates.frontTemplate : config.templates.backTemplate}
                                onChange={(e) => {
                                    const key = activeTemplate === 'front' ? 'frontTemplate' : 'backTemplate';
                                    setConfig({...config, templates: {...config.templates, [key]: e.target.value}});
                                }}
                                spellCheck={false}
                                placeholder="在此输入 HTML 模板代码..."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 h-[42px]">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center">
                            <Eye className="w-4 h-4 mr-2 text-slate-500"/> 
                            卡片效果预览 ({activeTemplate === 'front' ? 'Front' : 'Back'})
                        </h3>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-400">Mock Data</span>
                    </div>

                    <div className="bg-slate-200/50 rounded-xl border border-slate-300 shadow-inner overflow-hidden flex flex-col flex-1 min-h-[500px]">
                        <div className="p-6 overflow-y-auto flex-1 flex justify-center items-start">
                            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-0 min-w-[320px] max-w-[400px] w-full prose prose-sm overflow-hidden relative break-words">
                                <div dangerouslySetInnerHTML={{ 
                                    __html: generateCardContent(previewEntry, activeTemplate === 'front' ? config.templates.frontTemplate : config.templates.backTemplate) 
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

           </div>

        </div>

        {/* Variable Reference Modal */}
        {showVarHelp && (
            <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                             <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Code className="w-5 h-5"/></div>
                             <div>
                                 <h3 className="font-bold text-slate-800 text-lg">模板变量参考表</h3>
                                 <p className="text-xs text-slate-500">点击变量代码即可复制，粘贴到模板编辑器中使用。</p>
                             </div>
                        </div>
                        <button onClick={() => setShowVarHelp(false)} className="p-2 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-500 hover:text-slate-700"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variables.map(v => (
                                <div 
                                    key={v.code} 
                                    onClick={() => handleCopyVar(v.code)}
                                    className="group flex flex-col p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md hover:bg-blue-50/30 transition-all cursor-pointer bg-white relative"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <code className="text-sm font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100">{v.code}</code>
                                        <Copy className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-xs text-slate-600 leading-relaxed font-medium">{v.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center"><Info className="w-4 h-4 mr-2 text-slate-400"/> 所有变量数据来源于单词卡片信息。</span>
                        <button onClick={() => setShowVarHelp(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold">关闭</button>
                    </div>
                </div>
            </div>
        )}
    </section>
  );
};
