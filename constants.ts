import { StyleConfig, WordCategory, Scenario, TranslationEngine, WordInteractionConfig, PageWidgetConfig, AnkiConfig, OriginalTextConfig, MergeStrategyConfig, AutoTranslateConfig, DictionaryEngine } from './types';

export const DEFAULT_STYLE: StyleConfig = {
  color: '#000000',
  backgroundColor: 'transparent',
  underlineStyle: 'none',
  underlineColor: '#000000',
  underlineOffset: '2px',
  isBold: false,
  isItalic: false,
  fontSize: '1em',
  opacity: 1,
  densityMode: 'percent',
  densityValue: 100,
};

export const DEFAULT_ORIGINAL_TEXT_CONFIG: OriginalTextConfig = {
  show: true,
  activeMode: 'horizontal',
  bracketsTarget: 'original',
  horizontal: {
    translationFirst: false,
    wrappers: {
      translation: { prefix: '', suffix: '' },
      original: { prefix: '(', suffix: ')' }
    }
  },
  vertical: {
    translationFirst: true,
    baselineTarget: 'translation',
    wrappers: {
      translation: { prefix: '', suffix: '' },
      original: { prefix: '', suffix: '' }
    }
  },
  style: { ...DEFAULT_STYLE, color: '#94a3b8', fontSize: '0.85em' }
};

export const DEFAULT_STYLES: Record<WordCategory, StyleConfig> = {
  [WordCategory.KnownWord]: { ...DEFAULT_STYLE, color: '#15803d' }, 
  [WordCategory.WantToLearnWord]: { ...DEFAULT_STYLE, color: '#b45309', isBold: true }, 
  [WordCategory.LearningWord]: { ...DEFAULT_STYLE, color: '#b91c1c', backgroundColor: '#fef2f2', isBold: true }, 
};

export const INITIAL_SCENARIOS: Scenario[] = [
  { id: '1', name: '通用英语', isActive: true, isCustom: false },
  { id: '2', name: '雅思 / 托福', isActive: false, isCustom: false },
  { id: '3', name: '计算机科学', isActive: false, isCustom: false },
];

export const INITIAL_ENGINES: TranslationEngine[] = [
  { 
    id: 'gemini', 
    name: 'Gemini 3 Flash (推荐)', 
    type: 'ai', 
    isEnabled: true
  },
  { 
    id: 'google', 
    name: 'Google 翻译 (免 Key)', 
    type: 'standard', 
    isEnabled: true,
    isWebSimulation: true
  },
  { 
    id: 'microsoft', 
    name: '微软翻译 (免 Key)', 
    type: 'standard', 
    isEnabled: true,
    isWebSimulation: true
  },
  { 
    id: 'baidu', 
    name: '百度翻译 (免 Key)', 
    type: 'standard', 
    isEnabled: false,
    isWebSimulation: true
  },
  { 
    id: 'tencent', 
    name: '腾讯翻译君 (Tencent)', 
    type: 'standard', 
    isEnabled: false,
    appId: '', 
    secretKey: '', 
    endpoint: 'tmt.tencentcloudapi.com',
    region: 'ap-shanghai'
  }
];

export const INITIAL_DICTIONARIES: DictionaryEngine[] = [
  { 
    id: 'youdao', 
    name: '有道词典 (Youdao)', 
    endpoint: 'https://dict.youdao.com/jsonapi', 
    link: 'https://dict.youdao.com/',
    isEnabled: true, 
    priority: 1,
    description: '网易出品，数据全，包含音频、Collins 星级。'
  }
];

export const DEFAULT_WORD_INTERACTION: WordInteractionConfig = {
  mainTrigger: { modifier: 'None', action: 'Hover', delay: 600 },
  quickAddTrigger: { modifier: 'Alt', action: 'DoubleClick', delay: 0 },
  bubblePosition: 'top',
  showPhonetic: true,
  showOriginalText: true, 
  showDictExample: true,
  showDictTranslation: true,
  autoPronounce: true,
  autoPronounceAccent: 'US',
  autoPronounceCount: 1,
  dismissDelay: 300,
  allowMultipleBubbles: false,
  onlineDictUrl: '',
};

export const DEFAULT_PAGE_WIDGET: PageWidgetConfig = {
  enabled: true,
  x: -1, 
  y: -1,
  width: 380,
  maxHeight: 600,
  opacity: 0.98,
  backgroundColor: '#ffffff',
  fontSize: '14px',
  modalPosition: { x: 0, y: 0 },
  modalSize: { width: 500, height: 600 },
  showPhonetic: true,
  showMeaning: true,
  showMultiExamples: true,
  showExampleTranslation: true,
  showContextTranslation: true,
  showInflections: true,
  showPartOfSpeech: true,
  showTags: true,
  showImportance: true,
  showCocaRank: true,
  showSections: { known: false, want: true, learning: true },
  cardDisplay: [
    { id: 'context', label: '来源原句', enabled: true },
    { id: 'mixed', label: '中英混合', enabled: false },
    { id: 'dictExample', label: '词典例句', enabled: true },
  ]
};

export const DEFAULT_AUTO_TRANSLATE: AutoTranslateConfig = {
  enabled: true,
  bilingualMode: false,
  translateWholePage: false,
  matchInflections: true,
  aggressiveMode: false,
  blacklist: ['google.com', 'baidu.com'], 
  whitelist: ['nytimes.com', 'medium.com'],
  ttsSpeed: 1.0,
};

const DEFAULT_ANKI_FRONT = `<div class="card front"><div class="word">{{word}}</div><div class="ipa">{{phonetic_us}}</div></div>`;
const DEFAULT_ANKI_BACK = `<div class="card back"><div class="meaning">{{def_cn}}</div><hr/><div class="ex">{{dict_example}}</div></div>`;

export const DEFAULT_ANKI_CONFIG: AnkiConfig = {
  enabled: true,
  url: 'http://127.0.0.1:8765',
  deckNameWant: 'ContextLingo-Want',
  deckNameLearning: 'ContextLingo-Learning',
  modelName: 'Basic', 
  syncInterval: 90,
  autoSync: false,
  syncScope: { wantToLearn: true, learning: true },
  templates: { frontTemplate: DEFAULT_ANKI_FRONT, backTemplate: DEFAULT_ANKI_BACK }
};

export const DEFAULT_MERGE_STRATEGY: MergeStrategyConfig = {
  strategy: 'by_word',
  showMultiExamples: true,
  showExampleTranslation: true,
  showContextTranslation: true,
  showPartOfSpeech: true,
  showTags: true,
  showImportance: true,
  showCocaRank: true,
  showImage: true,
  showVideo: true,
  exampleOrder: [
    { id: 'context', label: '来源原句 (Context)', enabled: true },
    { id: 'mixed', label: '中英混合句 (Mixed)', enabled: true },
    { id: 'dictionary', label: '词典例句 (Dictionary)', enabled: true },
    { id: 'phrases', label: '常用短语 (Phrases)', enabled: true },
    { id: 'roots', label: '词根词缀 (Roots)', enabled: true },
    { id: 'synonyms', label: '近义词 (Synonyms)', enabled: true },
    { id: 'inflections', label: '词态变化 (Morphology)', enabled: true },
  ],
};