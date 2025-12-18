
export enum WordCategory {
  KnownWord = '已掌握单词',
  WantToLearnWord = '想学习单词',
  LearningWord = '正在学单词',
}

// Helper type for UI tabs
export type WordTab = WordCategory | 'all';

export interface StyleConfig {
  color: string;
  backgroundColor: string;
  underlineStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'wavy' | 'none';
  underlineColor: string;
  underlineOffset: string;
  isBold: boolean;
  isItalic: boolean;
  fontSize: string;
  opacity?: number; 
  // Density Settings
  densityMode: 'count' | 'percent';
  densityValue: number;
}

export interface TextWrapperConfig {
  prefix: string;
  suffix: string;
}

export interface LayoutSpecificConfig {
  translationFirst: boolean;
  // For vertical layout: which element sits on the text baseline?
  baselineTarget?: 'translation' | 'original'; 
  wrappers: {
    translation: TextWrapperConfig;
    original: TextWrapperConfig;
  };
}

export interface OriginalTextConfig {
  show: boolean;
  activeMode: 'horizontal' | 'vertical'; 
  bracketsTarget: 'translation' | 'original'; // Deprecated conceptually, kept for backward compat if needed
  
  // Isolated configurations
  horizontal: LayoutSpecificConfig;
  vertical: LayoutSpecificConfig;

  style: StyleConfig;
}

export interface PhraseItem {
  text: string;
  trans: string;
}

export interface RootItem {
  root: string;
  words: { text: string; trans: string }[];
}

export interface SynonymItem {
  text: string;
  trans: string;
}

export interface WordEntry {
  id: string;
  text: string; // 单词拼写
  partOfSpeech?: string; // 词性 (n., v., adj.)
  
  // Phonetics (Audio is generated dynamically via utils/audio.ts)
  phoneticUs?: string; // 美式音标
  phoneticUk?: string; // 英式音标

  // Definitions
  translation?: string; // 中文释义
  englishDefinition?: string; // 英文释义

  // Sentences
  contextSentence?: string; // 单词所在句子 (来源原句)
  contextSentenceTranslation?: string; // 单词所在句子的翻译
  contextParagraph?: string; // 单词所在段落 (Source Paragraph)
  contextParagraphTranslation?: string; // 单词所在段落翻译
  mixedSentence?: string; // 中英混合例句
  mixedParagraph?: string; // 中英混合段落
  
  // Examples
  dictionaryExample?: string; // 英文例句
  dictionaryExampleTranslation?: string; // 例句对应中文
  // dictionaryExampleAudioUrl removed - generated dynamically

  // Morphology & Metadata
  inflections?: string[]; // 词态变化 (eating, ate, eaten...)
  tags?: string[]; // 词汇等级 (中考, 高考, 四级, IELTS, Oxford 3000...)
  importance?: number; // 柯林斯星级/重要程度 (1-5)
  cocaRank?: number; // COCA 词频排名
  
  // Public Info (Read-only reference data)
  phrases?: PhraseItem[];
  roots?: RootItem[];
  synonyms?: SynonymItem[];

  // Media
  image?: string; // Selected image URL
  video?: {
      title: string;
      url: string;
      cover?: string;
  };

  // System
  addedAt: number;
  sourceUrl?: string;
  sourceTimestamp?: number; // Video timestamp in seconds
  scenarioId?: string;
  category: WordCategory;
}

// --- New Types for Rich Data Parsing (Add Word Modal) ---

export interface RichDictionaryResult {
    text: string;
    phoneticUs: string;
    phoneticUk: string;
    
    // Public Info
    inflections: string[]; // Common inflections
    phrases: PhraseItem[];
    roots: RootItem[];
    synonyms: SynonymItem[];
    
    images: string[]; // Multiple images available for selection
    video?: { title: string; url: string; cover: string };
    
    // Split Cards
    meanings: DictionaryMeaningCard[];

    // Alternative Sources (for "Expand Advanced Usage")
    expandEcMeanings?: DictionaryMeaningCard[];
    ecMeanings?: DictionaryMeaningCard[];
    source?: 'collins' | 'expand_ec' | 'ec' | 'default';
}

export interface DictionaryMeaningCard {
    partOfSpeech: string;
    defCn: string;
    defEn: string;
    inflections: string[]; // Specific to this meaning
    tags: string[];
    importance: number;
    cocaRank: number; // Defaults to 0/empty, user editable
    example: string;
    exampleTrans: string;
}

export interface Scenario {
  id: string;
  name: string;
  isActive: boolean;
  isCustom?: boolean;
}

export type EngineType = 'standard' | 'ai';

export interface TranslationEngine {
  id: string;
  name: string;
  type: EngineType;
  isEnabled: boolean;
  apiKey?: string;
  appId?: string; // Used as SecretId for Tencent
  secretKey?: string;
  endpoint?: string;
  model?: string;
  
  // Tencent / Cloud Specifics
  region?: string;
  projectId?: number;

  isTesting?: boolean;
  testResult?: 'success' | 'fail' | null;
  testErrorMessage?: string; // Specific error message from API
  isCustom?: boolean;
}

export interface DictionaryEngine {
  id: string;
  name: string;
  endpoint: string;
  link: string; // New: Official Website Link
  isEnabled: boolean; // Always true in UI
  priority: number;
  description?: string;
}

export interface AnkiTemplateConfig {
  frontTemplate: string;
  backTemplate: string;
}

export interface AnkiConfig {
  enabled: boolean;
  url: string;
  deckNameWant: string; // Target deck for "Want to Learn"
  deckNameLearning: string; // Target deck for "Learning"
  modelName: string; // New: Required for creating notes
  syncInterval: number;
  autoSync: boolean; // New: Auto sync toggle
  syncScope: {
    wantToLearn: boolean;
    learning: boolean;
  };
  templates: AnkiTemplateConfig;
  lastSyncTime?: number;
}

export type ModifierKey = 'None' | 'Alt' | 'Ctrl' | 'Shift' | 'Meta';
export type MouseAction = 'Hover' | 'Click' | 'DoubleClick' | 'RightClick';

export interface InteractionTrigger {
  modifier: ModifierKey;
  action: MouseAction;
  delay: number; // ms
}

export type BubblePosition = 'top' | 'bottom' | 'left' | 'right';

export interface WordInteractionConfig {
  mainTrigger: InteractionTrigger;
  quickAddTrigger: InteractionTrigger;
  
  bubblePosition: BubblePosition;

  showPhonetic: boolean;
  showOriginalText: boolean; 
  showDictExample: boolean;
  showDictTranslation: boolean;

  autoPronounce: boolean;
  autoPronounceAccent: 'US' | 'UK';
  autoPronounceCount: number;

  dismissDelay: number; // ms to wait before hiding bubble
  allowMultipleBubbles: boolean; // if true, new bubbles don't close old ones
  onlineDictUrl?: string; // New: URL template for online dictionary link
}

export type PopupCardField = 'context' | 'mixed' | 'dictExample';

export interface PopupCardItem {
  id: PopupCardField;
  label: string;
  enabled: boolean;
}

export interface PageWidgetConfig {
  enabled: boolean;
  // Set to 0 to indicate uninitialized position, triggering auto-position logic in component
  x: number; 
  y: number;
  width: number;
  maxHeight: number;
  opacity: number;
  backgroundColor: string;
  fontSize: string;
  
  modalPosition: { x: number, y: number };
  modalSize: { width: number, height: number };

  showPhonetic: boolean;
  showMeaning: boolean;
  showMultiExamples: boolean;
  
  showExampleTranslation: boolean; // Show translation for Dictionary Examples
  showContextTranslation: boolean; // Show translation for Context Sentences
  showInflections: boolean; // New: Show inflections in widget

  // New Fields for Rich Metadata in Widget
  showPartOfSpeech: boolean;
  showTags: boolean;
  showImportance: boolean;
  showCocaRank: boolean;

  showSections: {
    known: boolean;
    want: boolean;
    learning: boolean;
  };
  cardDisplay: PopupCardItem[];
}

export interface AutoTranslateConfig {
  enabled: boolean;
  bilingualMode: boolean; 
  translateWholePage: boolean; // New setting for scanning scope
  matchInflections: boolean; // New: Smart morphology matching
  aggressiveMode: boolean; // NEW: Aggressive Dictionary Matching
  blacklist: string[];
  whitelist: string[];
  ttsSpeed: number;
}

export interface MergeStrategyConfig {
  strategy: 'by_word' | 'by_word_and_meaning';
  showMultiExamples: boolean;
  
  // Toggles for Content Fields in Word Manager List
  showExampleTranslation: boolean;
  showContextTranslation: boolean;
  showPartOfSpeech: boolean; // New
  showTags: boolean; // New (Vocabulary Level)
  showImportance: boolean; // New (Collins)
  showCocaRank: boolean; // New
  showImage: boolean; // New
  showVideo: boolean; // New

  exampleOrder: { id: string, label: string, enabled: boolean }[];
}

export type AppView = 'dashboard' | 'words' | 'settings' | 'word-detail';
export type SettingSectionId = 'general' | 'visual-styles' | 'scenarios' | 'word-bubble' | 'page-widget' | 'engines' | 'preview' | 'anki';
