
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WordManager } from './components/WordManager';
import { VisualStylesSection } from './components/StyleEditor';
import { ScenariosSection, EnginesSection, InteractionSection, AnkiSection, PageWidgetSection, GeneralSection } from './components/Settings';
import { PreviewSection } from './components/settings/PreviewSection'; 
import { WordDetail } from './components/WordDetail'; // Import new component
import { Loader2 } from 'lucide-react';
import { AppView, SettingSectionId, Scenario, WordEntry, PageWidgetConfig, WordInteractionConfig, TranslationEngine, AnkiConfig, AutoTranslateConfig, StyleConfig, WordCategory, OriginalTextConfig, DictionaryEngine, WordTab } from './types';
import { DEFAULT_STYLES, DEFAULT_ORIGINAL_TEXT_CONFIG, DEFAULT_WORD_INTERACTION, DEFAULT_PAGE_WIDGET, INITIAL_ENGINES, DEFAULT_ANKI_CONFIG, DEFAULT_AUTO_TRANSLATE, INITIAL_SCENARIOS, INITIAL_DICTIONARIES } from './constants';
import { entriesStorage, scenariosStorage, pageWidgetConfigStorage, autoTranslateConfigStorage, enginesStorage, ankiConfigStorage, seedInitialData, stylesStorage, originalTextConfigStorage, interactionConfigStorage, dictionariesStorage } from './utils/storage';
import { preloadVoices } from './utils/audio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeSettingSection, setActiveSettingSection] = useState<SettingSectionId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailWord, setDetailWord] = useState<string>(''); // For word-detail view
  
  // State to pass down to WordManager for deep linking
  const [initialManagerTab, setInitialManagerTab] = useState<WordTab | undefined>(undefined);
  const [initialManagerSearch, setInitialManagerSearch] = useState<string>('');

  // --- Persistent State from Storage ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [pageWidgetConfig, setPageWidgetConfig] = useState<PageWidgetConfig>(DEFAULT_PAGE_WIDGET);
  const [autoTranslate, setAutoTranslate] = useState<AutoTranslateConfig>(DEFAULT_AUTO_TRANSLATE);
  const [engines, setEngines] = useState<TranslationEngine[]>(INITIAL_ENGINES);
  const [dictionaries, setDictionaries] = useState<DictionaryEngine[]>(INITIAL_DICTIONARIES);
  const [ankiConfig, setAnkiConfig] = useState<AnkiConfig>(DEFAULT_ANKI_CONFIG);
  const [styles, setStyles] = useState<Record<WordCategory, StyleConfig>>(DEFAULT_STYLES);
  const [originalTextConfig, setOriginalTextConfig] = useState<OriginalTextConfig>(DEFAULT_ORIGINAL_TEXT_CONFIG);
  const [interactionConfig, setInteractionConfig] = useState<WordInteractionConfig>(DEFAULT_WORD_INTERACTION);

  // Load data on mount
  useEffect(() => {
    preloadVoices(); 
    
    // Check URL params for routing (e.g., from Word Bubble)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const wordParam = params.get('word');
    const tabParam = params.get('tab');
    const searchParam = params.get('search');

    if (viewParam === 'word-detail' && wordParam) {
        setDetailWord(wordParam);
        setCurrentView('word-detail');
    } else if (viewParam === 'words') {
        setCurrentView('words');
        if (tabParam) setInitialManagerTab(tabParam as WordTab);
        if (searchParam) setInitialManagerSearch(searchParam);
    }

    const loadData = async () => {
      await seedInitialData();
      
      // Forced Migration for Dictionary Priorities
      const currentDicts = await dictionariesStorage.getValue();
      const iciba = currentDicts.find(d => d.id === 'iciba');
      
      let finalDictionaries = currentDicts;
      if (iciba && iciba.priority !== 1) {
          finalDictionaries = currentDicts.map(d => {
              if (d.id === 'iciba') return { ...d, priority: 1 };
              if (d.id === 'youdao') return { ...d, priority: 2 };
              return d;
          });
          await dictionariesStorage.setValue(finalDictionaries);
      }
      setDictionaries(finalDictionaries);

      const [s, e, p, a, eng, ank, sty, orig, interact] = await Promise.all([
        scenariosStorage.getValue(),
        entriesStorage.getValue(),
        pageWidgetConfigStorage.getValue(),
        autoTranslateConfigStorage.getValue(),
        enginesStorage.getValue(),
        ankiConfigStorage.getValue(),
        stylesStorage.getValue(),
        originalTextConfigStorage.getValue(),
        interactionConfigStorage.getValue(),
      ]);
      
      // Data Migration: Anki Config
      let finalAnkiConfig = ank;
      if (!finalAnkiConfig.deckNameWant || !finalAnkiConfig.deckNameLearning) {
          finalAnkiConfig = {
              ...DEFAULT_ANKI_CONFIG, 
              ...ank, 
              deckNameWant: ank.deckNameWant || DEFAULT_ANKI_CONFIG.deckNameWant,
              deckNameLearning: ank.deckNameLearning || DEFAULT_ANKI_CONFIG.deckNameLearning,
              syncScope: ank.syncScope || DEFAULT_ANKI_CONFIG.syncScope
          };
          const oldDeckName = (ank as any).deckName;
          if (oldDeckName && !finalAnkiConfig.deckNameLearning) {
             finalAnkiConfig.deckNameLearning = oldDeckName;
          }
      }

      setScenarios(s);
      setEntries(e);
      setPageWidgetConfig(p);
      setAutoTranslate(a);
      setEngines(eng);
      setAnkiConfig(finalAnkiConfig);
      setStyles(sty);
      setOriginalTextConfig(orig);
      setInteractionConfig(interact);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Auto-save
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
        Promise.all([
            entriesStorage.setValue(entries),
            scenariosStorage.setValue(scenarios),
            pageWidgetConfigStorage.setValue(pageWidgetConfig),
            autoTranslateConfigStorage.setValue(autoTranslate),
            enginesStorage.setValue(engines),
            dictionariesStorage.setValue(dictionaries),
            ankiConfigStorage.setValue(ankiConfig),
            stylesStorage.setValue(styles),
            originalTextConfigStorage.setValue(originalTextConfig),
            interactionConfigStorage.setValue(interactionConfig),
        ]).catch(err => console.error("Auto-save failed:", err));
    }, 800);
    return () => clearTimeout(timer);
  }, [entries, scenarios, pageWidgetConfig, autoTranslate, engines, dictionaries, ankiConfig, styles, originalTextConfig, interactionConfig, isLoading]);

  const scrollToSetting = (id: SettingSectionId) => {
    setCurrentView('settings');
    setActiveSettingSection(id);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -30; 
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  if (isLoading && entries.length === 0) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin"/></div>;
  }

  // Handle Full Screen Views (like Word Detail)
  if (currentView === 'word-detail') {
      return (
          <WordDetail 
             word={detailWord} 
             onBack={() => {
                 // If opened via URL (new tab), closing might be better or going to dashboard
                 if (window.history.length > 1) {
                     setCurrentView('dashboard');
                 } else {
                     // If it's a standalone tab opened by bubble, allow "Back" to go to dashboard too
                     setCurrentView('dashboard');
                 }
             }} 
          />
      );
  }

  return (
    <div className="flex min-h-screen bg-slate-100/50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onSettingScroll={scrollToSetting}
        activeSettingSection={activeSettingSection}
      />

      <main className="flex-1 ml-64 p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          
          {currentView === 'dashboard' && (
             <div className="animate-in fade-in duration-300">
               <Dashboard entries={entries} scenarios={scenarios} />
             </div>
          )}

          {currentView === 'words' && (
             <div className="animate-in fade-in duration-300">
               <WordManager 
                  scenarios={scenarios} 
                  entries={entries} 
                  setEntries={setEntries} 
                  ttsSpeed={autoTranslate.ttsSpeed || 1.0}
                  initialTab={initialManagerTab}
                  initialSearchQuery={initialManagerSearch}
               />
             </div>
          )}

          {currentView === 'settings' && (
             <div className="space-y-12 animate-in fade-in duration-300">
                <section id="general" className="scroll-mt-8">
                  <GeneralSection config={autoTranslate} setConfig={setAutoTranslate} />
                </section>

                <section id="visual-styles" className="scroll-mt-8">
                  <VisualStylesSection 
                    styles={styles} 
                    onStylesChange={setStyles} 
                    originalTextConfig={originalTextConfig}
                    onOriginalTextConfigChange={setOriginalTextConfig}
                  />
                </section>

                <section id="scenarios" className="scroll-mt-8">
                  <ScenariosSection scenarios={scenarios} setScenarios={setScenarios} />
                </section>
                
                <section id="word-bubble" className="scroll-mt-8">
                  <InteractionSection config={interactionConfig} setConfig={setInteractionConfig} />
                </section>

                <section id="page-widget" className="scroll-mt-8">
                   <PageWidgetSection widget={pageWidgetConfig} setWidget={setPageWidgetConfig} />
                </section>

                <section id="engines" className="scroll-mt-8">
                  <EnginesSection engines={engines} setEngines={setEngines} dictionaries={dictionaries} />
                </section>

                <section id="preview" className="scroll-mt-8">
                   <PreviewSection 
                      engines={engines} 
                      entries={entries} 
                      styles={styles} 
                      originalTextConfig={originalTextConfig} 
                      autoTranslateConfig={autoTranslate}
                   />
                </section>

                <section id="anki" className="scroll-mt-8">
                  <AnkiSection config={ankiConfig} setConfig={setAnkiConfig} entries={entries} setEntries={setEntries} />
                </section>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
