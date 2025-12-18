
import React, { useEffect, useState, useRef } from 'react';
import { WordEntry, WordInteractionConfig, WordCategory } from '../types';
import { Volume2, Plus, Check, ExternalLink, BookOpen } from 'lucide-react';
import { playWordAudio, playSentenceAudio, stopAudio } from '../utils/audio';
import { browser } from 'wxt/browser';

interface WordBubbleProps {
  entry: WordEntry | null;
  originalText: string;
  targetRect: DOMRect | null;
  config: WordInteractionConfig;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddWord: (id: string) => void;
  ttsSpeed?: number;
}

export const WordBubble: React.FC<WordBubbleProps> = ({ 
    entry, 
    originalText, 
    targetRect, 
    config, 
    isVisible, 
    onMouseEnter, 
    onMouseLeave, 
    onAddWord,
    ttsSpeed = 1.0
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [placedSide, setPlacedSide] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isAdded, setIsAdded] = useState(false);
  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    if (entry) {
        setIsAdded(entry.category === WordCategory.LearningWord || entry.category === WordCategory.KnownWord);
    }
  }, [entry]);

  useEffect(() => {
      hasAutoPlayedRef.current = false;
  }, [entry?.id]);

  useEffect(() => {
    if (!isVisible) {
      stopAudio();
      hasAutoPlayedRef.current = false;
    }
    return () => { stopAudio(); };
  }, [isVisible]);

  useEffect(() => {
      if (isVisible && entry && config.autoPronounceCount > 0 && !hasAutoPlayedRef.current) {
          // Auto play using smart player
          (async () => {
             for(let i=0; i<config.autoPronounceCount; i++) {
                 await playWordAudio(entry.text, config.autoPronounceAccent, ttsSpeed);
             }
          })();
          hasAutoPlayedRef.current = true;
      }
  }, [isVisible, entry, config.autoPronounceCount, config.autoPronounceAccent, ttsSpeed]);

  const handleAdd = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(entry) {
          onAddWord(entry.id);
          setIsAdded(true);
      }
  };

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry) return;
    playWordAudio(entry.text, config.autoPronounceAccent, ttsSpeed);
  };

  const playSentence = (text: string) => {
     playSentenceAudio(text, undefined, config.autoPronounceAccent, ttsSpeed);
  };

  const openDetail = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!entry) return;
      // Delegate to background script to avoid ERR_BLOCKED_BY_CLIENT
      const path = `/options.html?view=word-detail&word=${encodeURIComponent(entry.text)}`;
      browser.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE', path });
  };

  // Click on the word title -> Go to Word Manager -> All Words -> Search this word
  const goToWordManager = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!entry) return;
      // Construct URL with view=words, tab=all, and search=currentWord
      const path = `/options.html?view=words&tab=all&search=${encodeURIComponent(entry.text)}`;
      browser.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE', path });
  };

  // Position calculation logic remains the same...
  useEffect(() => {
    if (isVisible && targetRect && bubbleRef.current) {
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 12;
      let finalTop = 0; let finalLeft = 0; let side = config.bubblePosition;

      const getPos = (s: string) => {
          switch (s) {
              case 'top': return { t: targetRect.top - bubbleRect.height - gap, l: targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2) };
              case 'bottom': return { t: targetRect.bottom + gap, l: targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2) };
              case 'left': return { t: targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2), l: targetRect.left - bubbleRect.width - gap };
              case 'right': return { t: targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2), l: targetRect.right + gap };
              default: return { t: 0, l: 0 };
          }
      };

      let { t, l } = getPos(side);
      finalTop = t; finalLeft = l;

      if (side === 'bottom') {
          if (finalTop + bubbleRect.height > viewportHeight - 10) {
              if (targetRect.top - gap - 10 > bubbleRect.height) { side = 'top'; const res = getPos('top'); finalTop = res.t; finalLeft = res.l; }
          }
      } else if (side === 'top') {
           if (finalTop < 10) {
               if (viewportHeight - (targetRect.bottom + gap) - 10 > bubbleRect.height) { side = 'bottom'; const res = getPos('bottom'); finalTop = res.t; finalLeft = res.l; }
           }
      }

      if (finalLeft < 10) finalLeft = 10;
      if (finalLeft + bubbleRect.width > viewportWidth - 10) finalLeft = viewportWidth - bubbleRect.width - 10;
      if (finalTop < 10) finalTop = 10;
      if (finalTop + bubbleRect.height > viewportHeight - 10) finalTop = viewportHeight - bubbleRect.height - 10;

      setPosition({ top: finalTop, left: finalLeft });
      setPlacedSide(side as any);
    }
  }, [isVisible, targetRect, entry, config.bubblePosition]);

  if (!entry || !isVisible) return null;

  // Inline styles...
  const containerStyle: React.CSSProperties = { position: 'fixed', zIndex: 2147483647, backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', padding: '20px', width: '280px', boxSizing: 'border-box', top: position?.top ?? -9999, left: position?.left ?? -9999, opacity: position ? 1 : 0, transition: 'opacity 0.15s ease-out', pointerEvents: 'auto', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '16px', lineHeight: '1.5', color: '#0f172a', textAlign: 'left' };
  const arrowSize = 12;
  const arrowStyle: React.CSSProperties = { position: 'absolute', width: `${arrowSize}px`, height: `${arrowSize}px`, backgroundColor: '#ffffff', transform: 'rotate(45deg)', border: '1px solid #e2e8f0', zIndex: -1 };
  if (placedSide === 'top') Object.assign(arrowStyle, { bottom: '-6px', left: 'calc(50% - 6px)', borderTopColor: 'transparent', borderLeftColor: 'transparent' });
  else if (placedSide === 'bottom') Object.assign(arrowStyle, { top: '-6px', left: 'calc(50% - 6px)', borderBottomColor: 'transparent', borderRightColor: 'transparent' });
  else if (placedSide === 'left') Object.assign(arrowStyle, { right: '-6px', top: 'calc(50% - 6px)', borderBottomColor: 'transparent', borderLeftColor: 'transparent' });
  else if (placedSide === 'right') Object.assign(arrowStyle, { left: '-6px', top: 'calc(50% - 6px)', borderTopColor: 'transparent', borderRightColor: 'transparent' });

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', lineHeight: 1 };
  // Updated wordStyle to include interaction visual cues
  const wordStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', lineHeight: '1.2', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'underline', textDecorationColor: 'transparent' };
  const phoneticStyle: React.CSSProperties = { fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', color: '#94a3b8', display: 'block' };
  const btnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '9999px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', transition: 'background-color 0.2s, color 0.2s' };
  const addBtnStyle: React.CSSProperties = { ...btnStyle, backgroundColor: isAdded ? '#f0fdf4' : '#eff6ff', color: isAdded ? '#16a34a' : '#2563eb' };
  const meaningStyle: React.CSSProperties = { fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '12px', lineHeight: '1.4' };
  const originalBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '12px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #f1f5f9', color: '#334155' };
  const exampleStyle: React.CSSProperties = { fontSize: '12px', fontStyle: 'italic', color: '#475569', borderLeft: '3px solid #60a5fa', paddingLeft: '12px', marginTop: '4px', lineHeight: '1.5', cursor: 'pointer' };
  
  // Link styles
  const linkContainerStyle: React.CSSProperties = { marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11px', lineHeight: '1.4', display: 'flex', gap: '12px' };
  const linkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' };

  // Resolve Dictionary URL
  const dictUrl = config.onlineDictUrl ? config.onlineDictUrl.replace(/{word}/g, entry.text) : '';

  return (
    <div ref={bubbleRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={containerStyle}>
        <div style={arrowStyle}></div>
        <div style={headerStyle}>
            <div>
                <h4 
                    style={wordStyle} 
                    onClick={goToWordManager}
                    title="点击跳转到词库查看"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.textDecorationColor = '#93c5fd'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.textDecorationColor = 'transparent'; }}
                >
                    {entry.text}
                </h4>
                {config.showPhonetic && (entry.phoneticUs || entry.phoneticUk) && (
                    <span style={phoneticStyle}>{entry.phoneticUs || entry.phoneticUk}</span>
                )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={playAudio} style={btnStyle} title="播放发音"><Volume2 size={18} /></button>
                <button onClick={handleAdd} style={addBtnStyle} title={isAdded ? "已添加" : "添加到正在学"}>{isAdded ? <Check size={18} /> : <Plus size={18} />}</button>
            </div>
        </div>
        {config.showDictTranslation && (<div style={meaningStyle}>{entry.translation}</div>)}
        {config.showOriginalText && (<div style={originalBoxStyle}><span style={{ marginRight: '8px', color: '#94a3b8', userSelect: 'none' }}>原文:</span><span style={{ fontWeight: '500' }}>{originalText || '...'}</span></div>)}
        {config.showDictExample && entry.dictionaryExample && (
            <div style={exampleStyle} onClick={() => playSentence(entry.dictionaryExample!)} title="点击朗读例句">
                {entry.dictionaryExample}
            </div>
        )}
        
        <div style={linkContainerStyle}>
            <div 
                style={linkStyle}
                onClick={openDetail}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                title="查看详细释义、词源、例句等"
            >
                <BookOpen size={12} style={{ marginRight: '4px' }} />
                详细信息
            </div>

            {dictUrl && (
                <a 
                    href={dictUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={linkStyle}
                    onClick={(e) => { e.stopPropagation(); }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                >
                    <ExternalLink size={12} style={{ marginRight: '4px' }} />
                    在线词典
                </a>
            )}
        </div>
    </div>
  );
};
