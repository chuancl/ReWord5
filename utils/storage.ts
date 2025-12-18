
import { storage } from 'wxt/storage';
import { WordEntry, WordCategory, PageWidgetConfig, AutoTranslateConfig, Scenario, TranslationEngine, AnkiConfig, StyleConfig, OriginalTextConfig, WordInteractionConfig, DictionaryEngine } from '../types';
import { DEFAULT_PAGE_WIDGET, DEFAULT_AUTO_TRANSLATE, INITIAL_SCENARIOS, INITIAL_ENGINES, DEFAULT_ANKI_CONFIG, DEFAULT_STYLES, DEFAULT_ORIGINAL_TEXT_CONFIG, DEFAULT_WORD_INTERACTION, INITIAL_DICTIONARIES } from '../constants';

// Define storage keys and default values
export const entriesStorage = storage.defineItem<WordEntry[]>('local:entries', {
  defaultValue: [],
});

export const scenariosStorage = storage.defineItem<Scenario[]>('local:scenarios', {
  defaultValue: INITIAL_SCENARIOS,
});

export const stylesStorage = storage.defineItem<Record<WordCategory, StyleConfig>>('local:styles', {
    defaultValue: DEFAULT_STYLES,
});

export const originalTextConfigStorage = storage.defineItem<OriginalTextConfig>('local:originalTextConfig', {
  defaultValue: DEFAULT_ORIGINAL_TEXT_CONFIG,
});

export const pageWidgetConfigStorage = storage.defineItem<PageWidgetConfig>('local:pageWidgetConfig', {
  defaultValue: DEFAULT_PAGE_WIDGET,
});

export const autoTranslateConfigStorage = storage.defineItem<AutoTranslateConfig>('local:autoTranslateConfig', {
  defaultValue: DEFAULT_AUTO_TRANSLATE,
});

export const enginesStorage = storage.defineItem<TranslationEngine[]>('local:engines', {
  defaultValue: INITIAL_ENGINES,
});

export const dictionariesStorage = storage.defineItem<DictionaryEngine[]>('local:dictionaries', {
  defaultValue: INITIAL_DICTIONARIES,
});

export const ankiConfigStorage = storage.defineItem<AnkiConfig>('local:ankiConfig', {
  defaultValue: DEFAULT_ANKI_CONFIG,
});

export const interactionConfigStorage = storage.defineItem<WordInteractionConfig>('local:interactionConfig', {
  defaultValue: DEFAULT_WORD_INTERACTION,
});

// Helper to seed data if empty
export const seedInitialData = async () => {
  const existing = await entriesStorage.getValue();
  // Only seed if empty
  if (existing.length === 0) {
    const now = Date.now();
    
    // Sample data upgraded to new schema
    const sampleData: WordEntry[] = [
      {
        id: 'seed-book-1',
        text: 'book',
        translation: '预订',
        englishDefinition: 'To reserve (accommodation, a place, etc.); to buy a ticket in advance.',
        category: WordCategory.LearningWord,
        addedAt: now,
        scenarioId: '4', 
        contextSentence: 'I need to book a flight to London.',
        mixedSentence: '我需要 book (预订) 一张去伦敦的机票。',
        dictionaryExample: 'He booked a table at the restaurant.',
        dictionaryExampleTranslation: '他在餐厅预订了一张桌子。',
        phoneticUs: '/bʊk/',
        phoneticUk: '/bʊk/',
        inflections: ['booking', 'booked', 'books'],
        tags: ['Oxford 3000', 'CET4', 'Middle School'],
        importance: 5,
        cocaRank: 320
      },
      {
        id: 'seed-ephemeral',
        text: 'ephemeral',
        translation: '短暂的',
        englishDefinition: 'Lasting for a very short time.',
        category: WordCategory.LearningWord,
        addedAt: now,
        scenarioId: '1',
        contextSentence: 'Fashion is by nature ephemeral.',
        mixedSentence: '时尚本质上是 ephemeral (短暂) 的。',
        dictionaryExample: 'ephemeral pleasures',
        dictionaryExampleTranslation: '短暂的快乐',
        phoneticUs: '/əˈfem(ə)rəl/',
        phoneticUk: '/ɪˈfɛm(ə)r(ə)l/',
        tags: ['GRE', 'SAT', 'Advanced'],
        importance: 2,
        cocaRank: 12000
      }
    ];
    await entriesStorage.setValue(sampleData);
    console.log('ContextLingo: Seeding complete with', sampleData.length, 'entries.');
  }
};
