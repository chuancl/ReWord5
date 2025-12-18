
import ReactDOM from 'react-dom/client';
import React, { useState, useEffect, useRef } from 'react';
import { PageWidget } from '../../components/PageWidget';
import { WordBubble } from '../../components/WordBubble';
import '../../index.css'; 
import { entriesStorage, pageWidgetConfigStorage, autoTranslateConfigStorage, stylesStorage, originalTextConfigStorage, enginesStorage, interactionConfigStorage } from '../../utils/storage';
import { WordEntry, PageWidgetConfig, WordInteractionConfig, WordCategory, AutoTranslateConfig, ModifierKey, StyleConfig, OriginalTextConfig } from '../../types';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';
import { findFuzzyMatches, findAggressiveMatches } from '../../utils/matching';
import { buildReplacementHtml } from '../../utils/dom-builder';
import { browser } from 'wxt/browser';
import { preloadVoices, unlockAudio } from '../../utils/audio';
import { splitTextIntoSentences, normalizeEnglishText } from '../../utils/text-processing';

// --- Overlay App Component (Manages Widget & Bubbles) ---
interface ContentOverlayProps {
  initialWidgetConfig: PageWidgetConfig;
  initialEntries: WordEntry[];
  initialInteractionConfig: WordInteractionConfig;
  initialAutoTranslateConfig: AutoTranslateConfig; 
}

interface ActiveBubble {
    id: string; // entry.id
    entry: WordEntry;
    originalText: string;
    rect: DOMRect;
    triggerElement?: HTMLElement; // The element that triggered this bubble
}

const ContentOverlay: React.FC<ContentOverlayProps> = ({ 
    initialWidgetConfig, 
    initialEntries, 
    initialInteractionConfig,
    initialAutoTranslateConfig 
}) => {
  const [widgetConfig, setWidgetConfig] = useState(initialWidgetConfig);
  const [interactionConfig, setInteractionConfig] = useState(initialInteractionConfig);
  const [autoTranslateConfig, setAutoTranslateConfig] = useState(initialAutoTranslateConfig);
  const [entries, setEntries] = useState(initialEntries);
  
  // Widget Logic
  const [pageWords, setPageWords] = useState<WordEntry[]>([]);

  // Bubble Logic
  const [activeBubbles, setActiveBubbles] = useState<ActiveBubble[]>([]);
  
  // Timers
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Refs
  const interactionConfigRef = useRef(interactionConfig);
  const entriesRef = useRef(entries);
  
  useEffect(() => { interactionConfigRef.current = interactionConfig; }, [interactionConfig]);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  useEffect(() => {
    const unsubs = [
        pageWidgetConfigStorage.watch(v => v && setWidgetConfig(v)),
        interactionConfigStorage.watch(v => v && setInteractionConfig(v)),
        entriesStorage.watch(v => v && setEntries(v)),
        autoTranslateConfigStorage.watch(v => v && setAutoTranslateConfig(v)) 
    ];

    const pageContent = document.body.innerText;
    const relevant = entries.filter(e => pageContent.includes(e.translation || ''));
    setPageWords(relevant);

    return () => unsubs.forEach(u => u());
  }, [entries]);

  useEffect(() => {
      if (activeBubbles.length > 0) {
          const newBubbles = activeBubbles.map(b => {
              const updatedEntry = entries.find(e => e.id === b.id);
              return updatedEntry ? { ...b, entry: updatedEntry } : b;
          });
          setActiveBubbles(newBubbles);
      }
  }, [entries]);

  useEffect(() => {
      const handleUserInteraction = () => {
          unlockAudio();
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
      };
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      return () => {
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
      };
  }, []);

  const checkModifier = (e: MouseEvent, mod: ModifierKey) => {
      if (mod === 'None') return true;
      if (mod === 'Alt') return e.altKey;
      if (mod === 'Ctrl') return e.ctrlKey || e.metaKey; 
      if (mod === 'Shift') return e.shiftKey;
      if (mod === 'Meta') return e.metaKey;
      return true;
  };

  const addBubble = (entry: WordEntry, originalText: string, rect: DOMRect, triggerElement: HTMLElement) => {
      const config = interactionConfigRef.current;
      if (hideTimers.current.has(entry.id)) {
          clearTimeout(hideTimers.current.get(entry.id)!);
          hideTimers.current.delete(entry.id);
      }

      setActiveBubbles(prev => {
          const exists = prev.find(b => b.id === entry.id);
          if (!config.allowMultipleBubbles) {
              if (prev.length === 1 && exists) return prev;
              return [{ id: entry.id, entry, originalText, rect, triggerElement }];
          } else {
              if (exists) return prev;
              return [...prev, { id: entry.id, entry, originalText, rect, triggerElement }];
          }
      });
  };

  const scheduleRemoveBubble = (id: string) => {
      const config = interactionConfigRef.current;
      if (hideTimers.current.has(id)) clearTimeout(hideTimers.current.get(id)!);

      const timer = setTimeout(() => {
          setActiveBubbles(prev => prev.filter(b => b.id !== id));
          hideTimers.current.delete(id);
      }, config.dismissDelay || 300);

      hideTimers.current.set(id, timer);
  };

  useEffect(() => {
     const handleMouseOver = (e: MouseEvent) => {
         const config = interactionConfigRef.current;
         const currentEntries = entriesRef.current;
         
         const target = e.target as HTMLElement;
         const entryEl = target.closest('[data-entry-id]') as HTMLElement;
         
         if (entryEl) {
             const id = entryEl.getAttribute('data-entry-id');
             const originalText = entryEl.getAttribute('data-original-text') || '';
             const entry = currentEntries.find(w => w.id === id);
             
             if (entry && id) {
                 if (hideTimers.current.has(id)) {
                     clearTimeout(hideTimers.current.get(id)!);
                     hideTimers.current.delete(id);
                 }
                 
                 if (config.mainTrigger.action === 'Hover') {
                     if (checkModifier(e, config.mainTrigger.modifier)) {
                         if (showTimer.current) clearTimeout(showTimer.current);
                         
                         const delay = config.mainTrigger.delay;
                         showTimer.current = setTimeout(() => {
                            addBubble(entry, originalText, entryEl.getBoundingClientRect(), entryEl);
                         }, delay);
                     }
                 }
             }
         }
     };

     const handleMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const entryEl = target.closest('[data-entry-id]');
        if (entryEl) {
            const id = entryEl.getAttribute('data-entry-id');
            if (showTimer.current) {
                clearTimeout(showTimer.current);
                showTimer.current = null;
            }
            if (id) scheduleRemoveBubble(id);
        }
     };

     const handleTriggerEvent = (e: MouseEvent, actionType: 'Click' | 'DoubleClick' | 'RightClick') => {
         const config = interactionConfigRef.current;
         
         if (config.mainTrigger.action === actionType && checkModifier(e, config.mainTrigger.modifier)) {
            const target = e.target as HTMLElement;
            const entryEl = target.closest('[data-entry-id]') as HTMLElement;
            if (entryEl) {
                const currentEntries = entriesRef.current;
                const id = entryEl.getAttribute('data-entry-id');
                const originalText = entryEl.getAttribute('data-original-text') || '';
                const entry = currentEntries.find(w => w.id === id);
                if (entry) {
                    if (actionType === 'RightClick') e.preventDefault();
                    if (showTimer.current) clearTimeout(showTimer.current);
                    addBubble(entry, originalText, entryEl.getBoundingClientRect(), entryEl);
                    return; 
                }
            }
         }
         
         // Quick Add Trigger Logic
         if (config.quickAddTrigger.action === actionType && checkModifier(e, config.quickAddTrigger.modifier)) {
            const target = e.target as HTMLElement;
            const entryEl = target.closest('[data-entry-id]') as HTMLElement;
            if (entryEl) {
                const id = entryEl.getAttribute('data-entry-id');
                if (id) {
                     if (actionType === 'RightClick') e.preventDefault();
                     handleCaptureAndAdd(id, entryEl);
                }
            }
         }
     };

     const handleClick = (e: MouseEvent) => handleTriggerEvent(e, 'Click');
     const handleDblClick = (e: MouseEvent) => handleTriggerEvent(e, 'DoubleClick');
     const handleContextMenu = (e: MouseEvent) => handleTriggerEvent(e, 'RightClick');

     document.addEventListener('mouseover', handleMouseOver);
     document.addEventListener('mouseout', handleMouseOut);
     document.addEventListener('click', handleClick);
     document.addEventListener('dblclick', handleDblClick);
     document.addEventListener('contextmenu', handleContextMenu);

     return () => {
         document.removeEventListener('mouseover', handleMouseOver);
         document.removeEventListener('mouseout', handleMouseOut);
         document.removeEventListener('click', handleClick);
         document.removeEventListener('dblclick', handleDblClick);
         document.removeEventListener('contextmenu', handleContextMenu);
     };
  }, []);

  const handleBubbleMouseEnter = (id: string) => {
      if (hideTimers.current.has(id)) {
          clearTimeout(hideTimers.current.get(id)!);
          hideTimers.current.delete(id);
      }
  };

  const handleBubbleMouseLeave = (id: string) => {
      scheduleRemoveBubble(id);
  };

  // --- Core Context Logic ---

  const captureContext = (targetEl: HTMLElement, entry: WordEntry): Partial<WordEntry> => {
      // 1. Locate Block for Paragraphs
      const block = targetEl.closest('[data-lingo-source]') as HTMLElement;
      
      let contextParagraph = '';
      let contextParagraphTranslation = '';
      let mixedParagraph = '';
      let contextSentence = entry.contextSentence || '';
      let mixedSentence = '';
      let contextSentenceTranslation = '';
      let sourceUrl = window.location.href;
      let sourceTimestamp = 0;

      if (block) {
          contextParagraph = block.getAttribute('data-lingo-source') || '';
          contextParagraphTranslation = block.getAttribute('data-lingo-translation') || '';
          mixedParagraph = block.innerText; // Current mixed text
          
          // Original Sentence Strategy:
          // Try to find the sentence in the original paragraph that contains the translation
          // This is a best-effort heuristic.
          if (entry.translation && contextParagraph) {
               const sentences = contextParagraph.split(/([。！？.!?\n]+)/);
               // Simple reconstruction
               let found = '';
               for (let i = 0; i < sentences.length; i += 2) {
                   const sent = sentences[i] + (sentences[i+1] || '');
                   if (sent.includes(entry.translation)) {
                       found = sent.trim();
                       break;
                   }
               }
               if (found) contextSentence = found;
          }

          // Mixed Sentence Strategy
          // Find the sentence in the mixed paragraph that contains the target element text
          // Since targetEl is replaced, we can look for the replaced text
          const targetText = targetEl.innerText;
          const mixedSentences = mixedParagraph.split(/([。！？.!?\n]+)/);
          for (let i = 0; i < mixedSentences.length; i += 2) {
               const sent = mixedSentences[i] + (mixedSentences[i+1] || '');
               if (sent.includes(targetText)) {
                   mixedSentence = sent.trim();
                   break;
               }
          }
      }

      // 2. Video Timestamp
      const video = document.querySelector('video');
      if (video && !video.paused) {
          sourceTimestamp = Math.floor(video.currentTime);
          
          const urlObj = new URL(window.location.href);
          const hostname = urlObj.hostname;
          
          if (hostname.includes('youtube.com')) {
              urlObj.searchParams.set('t', sourceTimestamp + 's');
              sourceUrl = urlObj.toString();
          } else if (hostname.includes('bilibili.com')) {
              // Bilibili usually uses ?t= or &t=
              urlObj.searchParams.set('t', String(sourceTimestamp));
              sourceUrl = urlObj.toString();
          }
      }

      return {
          contextParagraph,
          contextParagraphTranslation,
          mixedParagraph,
          contextSentence,
          mixedSentence,
          contextSentenceTranslation,
          sourceUrl,
          sourceTimestamp,
          addedAt: Date.now() // Update added time to reflect learning action
      };
  };

  const handleCaptureAndAdd = async (id: string, targetEl?: HTMLElement) => {
      const allEntries = await entriesStorage.getValue();
      const targetEntry = allEntries.find(e => e.id === id);
      
      if (!targetEntry) return;

      let updates: Partial<WordEntry> = { category: WordCategory.LearningWord };

      if (targetEl) {
          const contextData = captureContext(targetEl, targetEntry);
          updates = { ...updates, ...contextData };
      }

      const newEntries = allEntries.map(e => e.id === id ? { ...e, ...updates } : e);
      await entriesStorage.setValue(newEntries);
      setEntries(newEntries);
  };
  
  // Handler for Bubble "Add" button
  const handleBubbleAdd = (id: string) => {
      const bubble = activeBubbles.find(b => b.id === id);
      handleCaptureAndAdd(id, bubble?.triggerElement);
  };

  const handleBatchAdd = (ids: string[]) => {
      ids.forEach(id => {
          const el = document.querySelector(`[data-entry-id="${id}"]`) as HTMLElement;
          handleCaptureAndAdd(id, el);
      });
  };

  return (
    <div className="reset-shadow-dom" style={{
        all: 'initial', 
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#0f172a'
    }}>
       <PageWidget 
          config={widgetConfig}
          setConfig={(v) => pageWidgetConfigStorage.setValue(v)}
          pageWords={pageWords}
          setPageWords={setPageWords}
          onBatchAddToLearning={handleBatchAdd}
       />

       {activeBubbles.map(bubble => (
           <WordBubble 
              key={bubble.id}
              entry={bubble.entry}
              originalText={bubble.originalText}
              targetRect={bubble.rect}
              config={interactionConfig}
              isVisible={true} 
              onMouseEnter={() => handleBubbleMouseEnter(bubble.id)}
              onMouseLeave={() => handleBubbleMouseLeave(bubble.id)}
              onAddWord={handleBubbleAdd}
              ttsSpeed={autoTranslateConfig.ttsSpeed} 
           />
       ))}
    </div>
  );
};


export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    console.log('ContextLingo: Content Script Initializing on', window.location.href);
    preloadVoices();

    let currentEntries = await entriesStorage.getValue();
    let currentWidgetConfig = await pageWidgetConfigStorage.getValue();
    let currentAutoTranslate = await autoTranslateConfigStorage.getValue();
    let currentStyles = await stylesStorage.getValue();
    let currentOriginalTextConfig = await originalTextConfigStorage.getValue();
    let currentEngines = await enginesStorage.getValue();
    let currentInteractionConfig = await interactionConfigStorage.getValue();

    autoTranslateConfigStorage.watch((newVal) => { if(newVal) currentAutoTranslate = newVal; });

    if (currentAutoTranslate.blacklist.includes('.*\\.cn$')) {
        currentAutoTranslate.blacklist = currentAutoTranslate.blacklist.filter(s => s !== '.*\\.cn$');
        await autoTranslateConfigStorage.setValue(currentAutoTranslate);
    }

    /**
     * Strict Sentence-Scoped Replacement (UPDATED for Aggressive Mode)
     * Now async to support API calls for aggressive matching.
     */
    const applySentenceScopedReplacements = async (
        block: HTMLElement, 
        sourceSentences: string[], 
        transSentences: string[]
    ) => {
        // 1. Map Text Nodes
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        let node;
        while(node = walker.nextNode()) {
            if (node.parentElement?.closest('.context-lingo-wrapper')) continue;
            textNodes.push(node as Text);
        }

        let fullText = "";
        const nodeMap: { node: Text, start: number, end: number }[] = [];
        textNodes.forEach(n => {
            const val = n.nodeValue || "";
            nodeMap.push({ node: n, start: fullText.length, end: fullText.length + val.length });
            fullText += val;
        });

        // 2. Identify Replacements per Sentence (Primary Pass)
        const replacements: { start: number, end: number, entry: WordEntry }[] = [];
        let searchCursor = 0;

        // Keep track of which entries are successfully matched in each sentence
        // to identify "missed" candidates for Aggressive Mode
        
        for (let idx = 0; idx < sourceSentences.length; idx++) {
            const sent = sourceSentences[idx];
            const trans = transSentences[idx] || "";
            
            const sentStart = fullText.indexOf(sent, searchCursor);
            if (sentStart === -1) {
                continue; 
            }
            const sentEnd = sentStart + sent.length;
            searchCursor = sentEnd; // Advance cursor

            // --- Phase 1: Standard Fuzzy Match ---
            const primaryMatches = findFuzzyMatches(sent, currentEntries, trans);
            // Track matched TEXTS to avoid triggering aggressive mode for the same word (even if ID differs)
            // const matchedTexts = new Set(primaryMatches.map(m => m.entry.text.toLowerCase()));

            primaryMatches.forEach(m => {
                let localPos = sent.indexOf(m.text);
                while (localPos !== -1) {
                    replacements.push({
                        start: sentStart + localPos,
                        end: sentStart + localPos + m.text.length,
                        entry: m.entry
                    });
                    localPos = sent.indexOf(m.text, localPos + 1);
                }
            });

            // --- Phase 2: Aggressive Match (Experimental) ---
            if (currentAutoTranslate.aggressiveMode) {
                // Identify candidates that exist in translation
                // Note: removed `matchedTexts` check to allow matching multiple occurrences of the same word (e.g. China twice in different contexts)
                const normTrans = normalizeEnglishText(trans);
                const candidatesInTrans = currentEntries.filter(e => {
                    const inTrans = normTrans.includes(e.text.toLowerCase()) || 
                                    (e.inflections && e.inflections.some(inf => normTrans.includes(inf.toLowerCase())));
                    return inTrans;
                });

                if (candidatesInTrans.length > 0) {
                    // Deduplicate missed candidates by text to reduce API calls
                    const uniqueMap = new Map<string, WordEntry>();
                    candidatesInTrans.forEach(c => uniqueMap.set(c.text, c));
                    const uniqueCandidates = Array.from(uniqueMap.values());
                    
                    for (const candidate of uniqueCandidates) {
                        try {
                            // Call API to get rich definitions (real-time lookup)
                            const response = await browser.runtime.sendMessage({
                                action: 'LOOKUP_WORD_RICH',
                                text: candidate.text
                            }) as any;

                            if (response && response.success && response.data) {
                                // Perform Aggressive Matching with new definitions on the sentence
                                const aggMatches = findAggressiveMatches(sent, candidate, response.data);
                                
                                aggMatches.forEach(m => {
                                    let localPos = sent.indexOf(m.text);
                                    while (localPos !== -1) {
                                        replacements.push({
                                            start: sentStart + localPos,
                                            end: sentStart + localPos + m.text.length,
                                            entry: m.entry
                                        });
                                        localPos = sent.indexOf(m.text, localPos + 1);
                                    }
                                });
                            }
                        } catch (e) {
                            console.warn("Aggressive lookup failed for", candidate.text, e);
                        }
                    }
                }
            }
        }

        // 3. Apply Replacements (Reverse Order & Overlap Check)
        replacements.sort((a, b) => b.start - a.start);

        const safeReplacements: typeof replacements = [];
        let lastStart = Number.MAX_VALUE;
        for (const r of replacements) {
            // Overlap check: ensure current end is not greater than previous start (since we iterate reverse)
            if (r.end <= lastStart) {
                safeReplacements.push(r);
                lastStart = r.start;
            }
        }

        // 4. Execute DOM Manipulation
        safeReplacements.forEach(r => {
            const target = nodeMap.find(n => r.start >= n.start && r.end <= n.end);
            
            if (target) {
                const { node, start } = target;
                const localStart = r.start - start;
                const localEnd = r.end - start;
                
                const val = node.nodeValue || "";
                const before = val.substring(0, localStart);
                const mid = val.substring(localStart, localEnd);
                const after = val.substring(localEnd);

                // Sanity check
                if (mid !== r.entry.text && mid !== r.entry.translation && mid !== mid) return;

                const span = document.createElement('span');
                span.className = 'context-lingo-word';
                span.innerHTML = buildReplacementHtml(
                    mid, // Original text found
                    r.entry.text,
                    r.entry.category,
                    currentStyles,
                    currentOriginalTextConfig,
                    r.entry.id
                );

                const parent = node.parentNode;
                if (parent) {
                    if (after) parent.insertBefore(document.createTextNode(after), node.nextSibling);
                    parent.insertBefore(span, node.nextSibling);
                    if (before) parent.insertBefore(document.createTextNode(before), node.nextSibling);
                    parent.removeChild(node);
                }
            }
        });
    };

    class TranslationScheduler {
        private buffer: { block: HTMLElement, sourceText: string }[] = [];
        private requestQueue: { 
            combinedText: string, 
            mappings: { block: HTMLElement, originalSentence: string, index: number }[] 
        }[] = [];
        
        private isProcessingQueue = false;
        private timer: ReturnType<typeof setTimeout> | null = null;
        private delimiter = " ||| "; 
        
        private maxBatchSize = 10; 
        private maxCharCount = 2000; 
        private rateLimitDelay = 350;

        add(block: HTMLElement) {
            if (block.hasAttribute('data-context-lingo-scanned')) return;
            const sourceText = block.innerText?.trim();
            if (!sourceText || sourceText.length < 2 || !/[\u4e00-\u9fa5]/.test(sourceText)) return;
            block.setAttribute('data-context-lingo-scanned', 'pending');
            this.buffer.push({ block, sourceText });
            this.scheduleFlush();
        }

        private scheduleFlush() {
            const currentChars = this.buffer.reduce((acc, item) => acc + item.sourceText.length, 0);
            if (this.buffer.length >= this.maxBatchSize || currentChars >= this.maxCharCount) {
                if (this.timer) clearTimeout(this.timer);
                this.flushBufferToQueue();
            } else {
                if (!this.timer) {
                    this.timer = setTimeout(() => this.flushBufferToQueue(), 150);
                }
            }
        }

        private flushBufferToQueue() {
            if (this.buffer.length === 0) return;
            if (this.timer) { clearTimeout(this.timer); this.timer = null; }

            const batchItems = this.buffer.splice(0, this.buffer.length);
            const allSentences: string[] = [];
            const mappings: { block: HTMLElement, originalSentence: string, index: number }[] = [];
            
            batchItems.forEach(item => {
                const sentences = splitTextIntoSentences(item.sourceText);
                sentences.forEach(sent => {
                    mappings.push({
                        block: item.block,
                        originalSentence: sent,
                        index: allSentences.length
                    });
                    allSentences.push(sent);
                });
            });

            const combinedText = allSentences.join(this.delimiter);
            this.requestQueue.push({ combinedText, mappings });
            this.processQueue();
        }

        private async processQueue() {
            if (this.isProcessingQueue) return;
            this.isProcessingQueue = true;

            while (this.requestQueue.length > 0) {
                const batchRequest = this.requestQueue.shift();
                if (!batchRequest) break;

                const engine = currentEngines.find(e => e.isEnabled);
                if (!engine) {
                    console.warn("ContextLingo: No active engine found.");
                    this.isProcessingQueue = false;
                    return;
                }

                try {
                    const response = await browser.runtime.sendMessage({
                        action: 'TRANSLATE_TEXT',
                        engine: engine,
                        text: batchRequest.combinedText,
                        target: 'en'
                    });

                    if (response.success && response.data.Response?.TargetText) {
                         const fullTranslatedText = response.data.Response.TargetText;
                         const splitPattern = /\s*\|\|\|\s*/; 
                         const translatedSentences = fullTranslatedText.split(splitPattern);
    
                         const blockUpdates = new Map<HTMLElement, { sourceSentences: string[], transSentences: string[] }>();
                         
                         batchRequest.mappings.forEach((mapItem) => {
                             const trans = translatedSentences[mapItem.index] || "";
                             if (!blockUpdates.has(mapItem.block)) {
                                 blockUpdates.set(mapItem.block, { sourceSentences: [], transSentences: [] });
                             }
                             const data = blockUpdates.get(mapItem.block)!;
                             data.sourceSentences.push(mapItem.originalSentence);
                             data.transSentences.push(trans);
                         });

                         // Apply updates per block
                         // Wait for all blocks to be processed (important for async aggressive mode)
                         const updatePromises: Promise<void>[] = [];
                         blockUpdates.forEach((data, block) => {
                             updatePromises.push(this.applyTranslationWithSentences(block, data.sourceSentences, data.transSentences));
                         });
                         await Promise.all(updatePromises);

                    } else {
                        const affectedBlocks = new Set(batchRequest.mappings.map(m => m.block));
                        affectedBlocks.forEach(b => b.setAttribute('data-context-lingo-scanned', 'error'));
                    }
                } catch (e) {
                    const affectedBlocks = new Set(batchRequest.mappings.map(m => m.block));
                    affectedBlocks.forEach(b => b.setAttribute('data-context-lingo-scanned', 'error'));
                }
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
            this.isProcessingQueue = false;
        }

        private async applyTranslationWithSentences(block: HTMLElement, sourceSentences: string[], transSentences: string[]) {
            const fullSource = sourceSentences.join('');
            const fullTrans = transSentences.join(' '); 

            block.setAttribute('data-lingo-source', fullSource);
            block.setAttribute('data-lingo-translation', fullTrans);

            if (currentAutoTranslate.bilingualMode) {
                if (!block.nextElementSibling?.classList.contains('context-lingo-bilingual-block')) {
                    const transBlock = document.createElement('div');
                    transBlock.className = 'context-lingo-bilingual-block';
                    transBlock.innerText = fullTrans;
                    block.after(transBlock);
                }
            }

            block.setAttribute('data-context-lingo-scanned', 'true');
            // Await the potentially async replacement process
            await applySentenceScopedReplacements(block, sourceSentences, transSentences);
        }
    }

    const scheduler = new TranslationScheduler();

    const scanAndTranslatePage = () => {
        const blockTags = ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'ADDRESS', 'ARTICLE', 'ASIDE', 'FIGCAPTION', 'TD', 'TH', 'DD', 'DT'];

        let rootElement = document.body;
        let isMainContentSearch = !currentAutoTranslate.translateWholePage;
        
        if (isMainContentSearch) {
             const mainCandidate = document.querySelector('article') || document.querySelector('main') || document.querySelector('[role="main"]');
             if (mainCandidate) {
                 rootElement = mainCandidate as HTMLElement;
             }
        }

        const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT, {
             acceptNode: (node) => {
                 const el = node as HTMLElement;
                 const technicalTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'IMG', 'INPUT', 'TEXTAREA', 'CODE', 'HEAD', 'META', 'BUTTON', 'LINK', 'MAP', 'OBJECT', 'VIDEO', 'AUDIO'];
                 if (technicalTags.includes(el.tagName)) return NodeFilter.FILTER_REJECT;
                 
                 if (el.isContentEditable) return NodeFilter.FILTER_REJECT;
                 if (el.closest('[data-context-lingo-container]')) return NodeFilter.FILTER_REJECT;
                 if (el.hasAttribute('data-context-lingo-scanned')) return NodeFilter.FILTER_REJECT;
                 if (el.offsetParent === null) return NodeFilter.FILTER_REJECT;

                 if (isMainContentSearch) {
                     const structuralTags = ['HEADER', 'FOOTER', 'NAV', 'ASIDE', 'MENU', 'DIALOG'];
                     if (structuralTags.includes(el.tagName)) return NodeFilter.FILTER_REJECT;
                 }

                 if (!blockTags.includes(el.tagName)) {
                     return NodeFilter.FILTER_SKIP; 
                 }

                 const text = el.innerText;
                 if (!text || !/[\u4e00-\u9fa5]/.test(text)) {
                     return NodeFilter.FILTER_SKIP;
                 }

                 if (el.querySelector(blockTags.join(','))) {
                     return NodeFilter.FILTER_SKIP;
                 }

                 return NodeFilter.FILTER_ACCEPT;
             }
        });

        while(walker.nextNode()) {
            const block = walker.currentNode as HTMLElement;
            scheduler.add(block);
        }
    };

    const hostname = window.location.hostname;
    const isBlacklisted = currentAutoTranslate.blacklist.some(d => hostname.match(new RegExp(d)));
    const isWhitelisted = currentAutoTranslate.whitelist.some(d => hostname.match(new RegExp(d)));
    
    if (isBlacklisted && !isWhitelisted) {
        console.log('ContextLingo: Site blacklisted, skipping.');
        return;
    }

    browser.runtime.onMessage.addListener((message) => {
       if (message.action === 'TRIGGER_TRANSLATION') {
           scanAndTranslatePage();
       }
    });

    if (isWhitelisted || currentAutoTranslate.enabled) {
        setTimeout(scanAndTranslatePage, 1000); 
        let debounceTimer: ReturnType<typeof setTimeout>;
        const observer = new MutationObserver((mutations) => {
            if (mutations.some(m => m.addedNodes.length > 0)) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(scanAndTranslatePage, 2000);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    await createShadowRootUi(ctx, {
      name: 'context-lingo-ui',
      position: 'inline',
      onMount: (container) => {
        const wrapper = document.createElement('div');
        wrapper.id = 'context-lingo-app-root';
        wrapper.setAttribute('data-context-lingo-container', 'true');
        container.append(wrapper);
        
        const root = ReactDOM.createRoot(wrapper);
        root.render(
            <React.StrictMode>
                <ContentOverlay 
                    initialWidgetConfig={currentWidgetConfig}
                    initialEntries={currentEntries}
                    initialInteractionConfig={currentInteractionConfig}
                    initialAutoTranslateConfig={currentAutoTranslate}
                />
            </React.StrictMode>
        );
        return root;
      },
      onRemove: (root) => root?.unmount(),
    }).then(ui => ui.mount());

    stylesStorage.watch((newVal) => { if(newVal) currentStyles = newVal; });
    originalTextConfigStorage.watch((newVal) => { if(newVal) currentOriginalTextConfig = newVal; });
    entriesStorage.watch((newVal) => { if(newVal) currentEntries = newVal; });
    enginesStorage.watch((newVal) => { if(newVal) currentEngines = newVal; });
    interactionConfigStorage.watch((newVal) => { if(newVal) currentInteractionConfig = newVal; });
  },
});
