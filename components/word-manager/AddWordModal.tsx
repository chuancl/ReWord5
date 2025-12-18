

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Wand2, Volume2, Save, Search, Youtube, Layers, Star, Edit3, ImageOff, Sparkles, Tag, BookOpenCheck } from 'lucide-react';
import { WordEntry, RichDictionaryResult, DictionaryMeaningCard, WordCategory } from '../../types';
import { fetchRichWordDetails } from '../../utils/dictionary-service';
import { playWordAudio } from '../../utils/audio';
import { browser } from 'wxt/browser';
import { Toast, ToastMessage } from '../ui/Toast';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entryData: Partial<WordEntry>) => Promise<void>;
  initialCategory: WordCategory; 
}

// Internal State for Editable Cards
interface EditableCardState extends DictionaryMeaningCard {
    isSelected: boolean;
    selectedImage: string | null; // URL or null
}

interface SuggestionItem {
    entry: string;
    explanation: string;
}

interface InfoTagProps {
    text: string;
    trans: string;
    onHover: (e: React.MouseEvent, t: string) => void;
    onLeave: () => void;
}

// Helper Component for Unified Tags with Tooltips (Now uses callback for Portal Tooltip)
const InfoTag: React.FC<InfoTagProps> = ({ text, trans, onHover, onLeave }) => (
    <div 
        className="cursor-help inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all"
        onMouseEnter={(e) => onHover(e, trans)}
        onMouseLeave={onLeave}
    >
        <span className="font-medium mr-1">{text}</span>
    </div>
);

export const AddWordModal: React.FC<AddWordModalProps> = ({ isOpen, onClose, onConfirm, initialCategory }) => {
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RichDictionaryResult | null>(null);
  const [currentSource, setCurrentSource] = useState<string>('default'); 
  
  const [cards, setCards] = useState<EditableCardState[]>([]);
  
  // Tooltip State for Phrases/Roots
  const [tooltip, setTooltip] = useState<{ rect: DOMRect, text: string } | null>(null);

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<{ url: string; rect: DOMRect } | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local Toast State for this Modal
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
      if(!isOpen) {
          setInputText('');
          setSearchResult(null);
          setCards([]);
          setTooltip(null);
          setPreviewImage(null);
          setSuggestions([]);
          setShowSuggestions(false);
          setToast(null);
          setCurrentSource('default');
      }
  }, [isOpen]);

  // Debounce for suggestions
  useEffect(() => {
    if (searchResult && searchResult.text.toLowerCase() === inputText.trim().toLowerCase()) {
        setShowSuggestions(false);
        return;
    }

    const timer = setTimeout(async () => {
        if (inputText.trim().length > 0 && !isSearching) {
            try {
                const res = await browser.runtime.sendMessage({ action: 'SUGGEST_WORD', text: inputText });
                if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                    setSuggestions(res.data);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (e) {
                console.warn("Suggestion fetch failed", e);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText, isSearching, searchResult]);

  // Close suggestions on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLookup = async (overrideText?: string) => {
      const textToSearch = overrideText || inputText.trim();
      if (!textToSearch) return;

      setIsSearching(true);
      setSearchResult(null);
      setCards([]);
      setShowSuggestions(false);
      setToast(null);
      
      if (overrideText) setInputText(overrideText);

      try {
          const result = await fetchRichWordDetails(textToSearch);
          setSearchResult(result);
          setCurrentSource(result.source || 'default');
          
          // Initialize editable cards
          const initialCards: EditableCardState[] = result.meanings.map((m, idx) => ({
              ...m,
              isSelected: idx === 0, 
              selectedImage: null 
          }));
          setCards(initialCards);
          
          if (result.source === 'expand_ec') {
             showToast('当前数据已显示高阶用法', 'info');
          }

      } catch (e) {
          console.error(e);
          showToast('查询失败，未找到单词信息', 'error');
      } finally {
          setIsSearching(false);
      }
  };

  const handleExpandAdvanced = () => {
      if (!searchResult) return;

      if (currentSource === 'expand_ec') {
          showToast('当前数据已显示高阶用法', 'info');
          return;
      }

      // 1. Try expand_ec
      if (searchResult.expandEcMeanings && searchResult.expandEcMeanings.length > 0) {
          const newCards = searchResult.expandEcMeanings.map((m, i) => ({
              ...m,
              isSelected: i === 0,
              selectedImage: null
          }));
          setCards(newCards);
          setCurrentSource('expand_ec');
          showToast('已切换至高阶用法', 'success');
          return;
      } 
      
      // 2. Fallback to ec
      if (searchResult.ecMeanings && searchResult.ecMeanings.length > 0) {
           const newCards = searchResult.ecMeanings.map((m, i) => ({
              ...m,
              isSelected: i === 0,
              selectedImage: null
          }));
          setCards(newCards);
          setCurrentSource('ec');
          showToast('暂无高阶数据，已展示基础释义', 'warning');
          return;
      }

      showToast('未查询到更多释义数据', 'error');
  };

  const handleUpdateCard = (index: number, field: keyof EditableCardState, value: any) => {
      setCards(prev => prev.map((card, i) => i === index ? { ...card, [field]: value } : card));
  };

  const handleImport = async () => {
      if (!searchResult) return;
      const promises: Promise<void>[] = [];
      
      cards.forEach((card, idx) => {
          if (!card.isSelected) return;

          const entry: Partial<WordEntry> = {
              text: searchResult.text,
              phoneticUk: searchResult.phoneticUk,
              phoneticUs: searchResult.phoneticUs,
              
              translation: card.defCn,
              englishDefinition: card.defEn,
              
              partOfSpeech: card.partOfSpeech,

              inflections: [...new Set([...searchResult.inflections, ...card.inflections])],
              
              dictionaryExample: card.example,
              dictionaryExampleTranslation: card.exampleTrans,
              
              tags: card.tags,
              importance: card.importance,
              cocaRank: Number(card.cocaRank) || 0,
              
              image: card.selectedImage || undefined,
              video: searchResult.video, 
              
              phrases: searchResult.phrases,
              roots: searchResult.roots,
              synonyms: searchResult.synonyms,
              
              category: initialCategory,
              addedAt: Date.now() + idx, 
              scenarioId: '1'
          };
          promises.push(onConfirm(entry));
      });

      await Promise.all(promises);
      onClose();
  };

  // Tooltip Handlers
  const handleTagHover = (e: React.MouseEvent, text: string) => {
     setTooltip({
         rect: e.currentTarget.getBoundingClientRect(),
         text
     });
  };

  const handleTagLeave = () => {
      setTooltip(null);
  };

  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4 items-center shrink-0 z-50 relative">
                    {/* Input Container */}
                    <div className="relative flex-1" ref={dropdownRef}>
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-bold text-slate-800"
                                placeholder="输入英文单词..."
                                value={inputText}
                                onChange={e => { setInputText(e.target.value); setShowSuggestions(true); }}
                                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                                autoFocus
                            />
                            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 z-[60]">
                                {suggestions.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => handleLookup(item.entry)}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center group transition-colors"
                                    >
                                        <span className="font-bold text-slate-800 group-hover:text-blue-700">{item.entry}</span>
                                        <span className="text-xs text-slate-400 truncate max-w-[60%] text-right group-hover:text-slate-500">{item.explanation}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => handleLookup()}
                        disabled={isSearching || !inputText}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                        智能添加
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6 custom-scrollbar">
                    {!searchResult && !isSearching && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Wand2 className="w-16 h-16 mb-4 opacity-20" />
                            <p>输入单词并点击“智能添加”开始</p>
                        </div>
                    )}

                    {searchResult && (
                        <div className="space-y-6 max-w-6xl mx-auto">
                            {/* 1. Public Info Panel */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left: Word Basic & Public Data */}
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-4 mb-2">
                                            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{String(searchResult.text)}</h2>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 font-mono">
                                                {searchResult.phoneticUk && (
                                                    <span className="flex items-center cursor-pointer hover:text-blue-600 transition" onClick={() => playWordAudio(searchResult.text, 'UK')}>
                                                        <span className="text-[10px] mr-1 text-slate-400 font-sans">UK</span> {String(searchResult.phoneticUk)} <Volume2 className="w-3.5 h-3.5 ml-1 opacity-50"/>
                                                    </span>
                                                )}
                                                {searchResult.phoneticUs && (
                                                    <span className="flex items-center cursor-pointer hover:text-blue-600 transition" onClick={() => playWordAudio(searchResult.text, 'US')}>
                                                        <span className="text-[10px] mr-1 text-slate-400 font-sans">US</span> {String(searchResult.phoneticUs)} <Volume2 className="w-3.5 h-3.5 ml-1 opacity-50"/>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inflections */}
                                        {searchResult.inflections.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {searchResult.inflections.map(f => (
                                                    <span key={String(f)} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">{String(f)}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-6 mt-6">
                                            {/* Phrases */}
                                            {searchResult.phrases.length > 0 && (
                                                <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">常用短语 (Phrases)</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {searchResult.phrases.map((p, i) => (
                                                            <InfoTag 
                                                                key={i} 
                                                                text={String(p.text)} 
                                                                trans={String(p.trans)} 
                                                                onHover={handleTagHover}
                                                                onLeave={handleTagLeave}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Roots */}
                                            {searchResult.roots.length > 0 && (
                                                <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">词根 (Roots)</span>
                                                    <div className="space-y-4">
                                                        {searchResult.roots.map((r, i) => (
                                                            <div key={i} className="flex flex-col gap-1.5">
                                                                <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded w-fit border border-slate-100">{String(r.root)}</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {r.words.map((w, wi) => (
                                                                        <InfoTag 
                                                                            key={wi} 
                                                                            text={String(w.text)} 
                                                                            trans={String(w.trans)} 
                                                                            onHover={handleTagHover}
                                                                            onLeave={handleTagLeave}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Synonyms */}
                                            {searchResult.synonyms.length > 0 && (
                                                <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">近义词 (Synonyms)</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {searchResult.synonyms.map((s, i) => (
                                                            <InfoTag 
                                                                key={i} 
                                                                text={String(s.text)} 
                                                                trans={String(s.trans)} 
                                                                onHover={handleTagHover}
                                                                onLeave={handleTagLeave}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Right: Video */}
                                    {searchResult.video && (
                                        <div className="w-full lg:w-80 shrink-0">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">视频讲解</span>
                                            <div className="bg-slate-900 rounded-lg overflow-hidden relative group aspect-video flex items-center justify-center border border-slate-800 shadow-md">
                                                {searchResult.video.cover && <img src={searchResult.video.cover} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition"/>}
                                                <a href={searchResult.video.url} target="_blank" rel="noopener noreferrer" className="relative z-10 flex flex-col items-center text-white">
                                                    <Youtube className="w-10 h-10 mb-2 drop-shadow-md text-red-600" />
                                                    <span className="text-xs font-bold text-center px-4 line-clamp-2">{String(searchResult.video.title)}</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Editable Meaning Cards */}
                            <div>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Layers className="w-4 h-4 mr-2"/>
                                        释义卡片 (Select & Edit)
                                    </h3>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleExpandAdvanced}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition shadow-sm active:scale-95"
                                            title="尝试获取更高阶、更详细的柯林斯/英英释义"
                                        >
                                            <BookOpenCheck className="w-3.5 h-3.5" />
                                            展开高阶用法
                                        </button>
                                        <div className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                                            选中卡片后可直接编辑内容
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    {cards.map((card, index) => (
                                        <div 
                                            key={index} 
                                            className={`relative border-2 rounded-xl transition-all group ${
                                                card.isSelected 
                                                ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-50' 
                                                : 'bg-white border-slate-200 opacity-90 hover:border-blue-300'
                                            }`}
                                        >
                                            {/* Selection Checkbox */}
                                            <div 
                                                className="absolute top-4 left-4 z-10"
                                                onClick={() => handleUpdateCard(index, 'isSelected', !card.isSelected)}
                                            >
                                                <div className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${card.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
                                                    {card.isSelected && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white -rotate-45 mb-0.5"></div>}
                                                </div>
                                            </div>

                                            <div className="pl-14 pr-6 py-6">
                                                {/* Top Row: POS, Definition, Star, COCA */}
                                                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                                                    <div className="flex-1 space-y-4">
                                                        {/* Word & POS */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-serif font-bold text-xl text-slate-400 w-12 text-center bg-slate-50 rounded py-1 border border-slate-100">{String(card.partOfSpeech)}</span>
                                                            
                                                            {/* Editable Definition (CN) */}
                                                            <div className="flex-1 relative group/input">
                                                                <input 
                                                                    type="text" 
                                                                    value={card.defCn} 
                                                                    onChange={(e) => handleUpdateCard(index, 'defCn', e.target.value)}
                                                                    className="w-full text-lg font-bold text-slate-800 border-b-2 border-transparent hover:border-blue-200 focus:border-blue-500 focus:outline-none bg-transparent px-1 transition-colors"
                                                                    placeholder="中文释义"
                                                                />
                                                                <Edit3 className="w-3.5 h-3.5 text-slate-300 absolute right-0 top-1.5 opacity-0 group-hover/input:opacity-100 pointer-events-none"/>
                                                            </div>
                                                        </div>

                                                        {/* Editable Definition (EN) */}
                                                        <div className="relative group/input">
                                                            <input 
                                                                type="text" 
                                                                value={card.defEn} 
                                                                onChange={(e) => handleUpdateCard(index, 'defEn', e.target.value)}
                                                                className="w-full text-sm text-slate-600 italic border-b border-transparent hover:border-blue-200 focus:border-blue-500 focus:outline-none bg-transparent px-1 transition-colors"
                                                                placeholder="英文释义 (English Definition)"
                                                            />
                                                            <Edit3 className="w-3 h-3 text-slate-300 absolute right-0 top-1 opacity-0 group-hover/input:opacity-100 pointer-events-none"/>
                                                        </div>
                                                    </div>

                                                    {/* Meta: Star & COCA & Tags */}
                                                    <div className="flex flex-col gap-3 min-w-[140px] pt-1">
                                                        {/* Star Rating */}
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Collins Level</label>
                                                            <div className="flex gap-1">
                                                                {[1,2,3,4,5].map(star => (
                                                                    <Star 
                                                                        key={star}
                                                                        className={`w-4 h-4 cursor-pointer transition ${star <= card.importance ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                                                                        onClick={() => handleUpdateCard(index, 'importance', star)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* COCA Rank */}
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">COCA Rank</label>
                                                            <input 
                                                                type="number"
                                                                value={card.cocaRank || ''}
                                                                onChange={(e) => handleUpdateCard(index, 'cocaRank', parseInt(e.target.value))}
                                                                placeholder="Rank #"
                                                                className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                                                            />
                                                        </div>

                                                        {/* NEW: Vocabulary Level Tags */}
                                                        {card.tags && card.tags.length > 0 && (
                                                            <div>
                                                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block flex items-center"><Tag className="w-3 h-3 mr-1"/> Level / Tags</label>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {card.tags.map(tag => (
                                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-medium">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Example Section */}
                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 group/example relative">
                                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-emerald-400 rounded-r"></div>
                                                    <div className="pl-3 space-y-2">
                                                        <div className="relative">
                                                            <textarea 
                                                                value={card.example}
                                                                onChange={(e) => handleUpdateCard(index, 'example', e.target.value)}
                                                                className="w-full bg-transparent text-sm text-slate-700 font-medium border-none p-0 focus:ring-0 resize-none h-auto"
                                                                rows={2}
                                                                placeholder="输入英文例句..."
                                                            />
                                                        </div>
                                                        <div className="relative border-t border-slate-200/50 pt-2">
                                                            <textarea 
                                                                value={card.exampleTrans}
                                                                onChange={(e) => handleUpdateCard(index, 'exampleTrans', e.target.value)}
                                                                className="w-full bg-transparent text-xs text-slate-500 border-none p-0 focus:ring-0 resize-none h-auto"
                                                                rows={1}
                                                                placeholder="输入例句翻译..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Image Selector (Per Card) */}
                                                {searchResult.images.length > 0 && (
                                                    <div className="mt-4">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">配图选择 (点击选中并预览)</span>
                                                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                            {/* No Image Option */}
                                                            <div 
                                                                onClick={() => handleUpdateCard(index, 'selectedImage', null)}
                                                                className={`shrink-0 w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition ${card.selectedImage === null ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                            >
                                                                <ImageOff className="w-6 h-6 mb-1"/>
                                                                <span className="text-[10px]">无图</span>
                                                            </div>
                                                            
                                                            {/* Image Options */}
                                                            {searchResult.images.map((imgUrl, imgIdx) => (
                                                                <div 
                                                                    key={imgIdx}
                                                                    onClick={(e) => {
                                                                        handleUpdateCard(index, 'selectedImage', imgUrl);
                                                                        setPreviewImage({ url: imgUrl, rect: e.currentTarget.getBoundingClientRect() });
                                                                    }}
                                                                    onMouseLeave={() => setPreviewImage(null)}
                                                                    className={`shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden cursor-pointer relative group/img ${card.selectedImage === imgUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
                                                                >
                                                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                                                    {card.selectedImage === imgUrl && (
                                                                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                                            <div className="bg-blue-600 rounded-full p-1"><Save className="w-3 h-3 text-white"/></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="text-sm text-slate-500">
                        {searchResult ? `共找到 ${searchResult.meanings.length} 个义项，已选 ${cards.filter(c => c.isSelected).length} 个` : ''}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition">取消</button>
                        <button 
                        onClick={handleImport}
                        disabled={!searchResult || cards.filter(c => c.isSelected).length === 0}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                        >
                        <Save className="w-4 h-4"/>
                        保存选中的词条
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Local Toast for Modal */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Portal for Tooltip (Phrases/Roots) */}
        {tooltip && createPortal(
            <div 
                style={{
                    position: 'fixed', 
                    top: tooltip.rect.top - 12, 
                    left: tooltip.rect.left + tooltip.rect.width / 2, 
                    transform: 'translate(-50%, -100%)',
                    zIndex: 999999,
                    pointerEvents: 'none'
                }}
                className="animate-in fade-in duration-200"
            >
                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs whitespace-normal text-center leading-relaxed">
                    {tooltip.text} 
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
            </div>,
            document.body
        )}

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
                    <img src={previewImage.url} className="max-w-[280px] max-h-[220px] object-cover rounded bg-slate-50" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white"></div>
            </div>,
            document.body
        )}
    </>
  );
};