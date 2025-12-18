
// --- 1. Basic / EC / Expand EC ---
export interface WfObject { name?: string; value?: string; }
export interface WfItem { wf?: WfObject; }
export interface TrObject { l?: { i?: string[] }; }
export interface EcWord { 
    usphone?: string; 
    ukphone?: string; 
    trs?: { tr?: TrObject[]; }[]; 
    return_phrase?: { l?: { i?: string } };
    wfs?: WfItem[]; 
}
export interface EcData { word?: EcWord[]; exam_type?: string[]; }

export interface ExpandEcItem { transList?: { content?: { sents?: { sentOrig?: string; sentTrans?: string }[] }; trans?: string; }[]; pos?: string; }
export interface ExpandEcData { word?: ExpandEcItem[]; }

// --- 2. Collins & Collins Primary ---
export interface CollinsSentence { sent_orig?: string; sent_trans?: string; }
export interface CollinsTranEntry { 
    pos_entry?: { pos?: string; pos_tips?: string }; 
    tran?: string; 
    exam_sents?: CollinsSentence[] | CollinsSentence; 
}
export interface CollinsEntry {
    tran_entry?: CollinsTranEntry[] | CollinsTranEntry;
}
export interface CollinsEntryWrapper { 
    entry?: CollinsEntry[] | CollinsEntry; 
}
// Updated: collins_entries is an array representing "super headwords" groups
export interface CollinsData { 
    collins_entries?: { 
        entries?: CollinsEntryWrapper; 
        star?: number; 
        headword?: string;
    }[]; 
}

export interface CollinsPrimaryExample {
    example?: string;
    tran?: string;
    sense?: { word?: string }; // Added for nested translation structure
}

export interface CollinsPrimarySense { 
    definition?: string; 
    word?: string; 
    examples?: CollinsPrimaryExample[]; 
}

export interface CollinsPrimaryGramcat { 
    partofspeech?: string; 
    senses?: CollinsPrimarySense[]; 
    audio?: string; 
    audiourl?: string; // Added for Collins audio
}

export interface CollinsPrimaryData { gramcat?: CollinsPrimaryGramcat[]; words?: { word?: string }; }

// --- 3. Phrases & Synonyms & Roots ---
// Updated PhrItem based on user feedback: phrs.phrs[0].phr.headword...
export interface PhrInner {
    headword?: { l?: { i?: string } };
    // trs array containing tr which can be object or array
    trs?: { tr?: { l?: { i?: string } } | { l?: { i?: string } }[] }[]; 
}
export interface PhrItem { 
    phr?: PhrInner;
}
export interface PhrsData { phrs?: PhrItem[]; }

export interface SynoItem { pos?: string; tran?: string; ws?: { w?: string }[]; }
export interface SynoData { synos?: { syno?: SynoItem; }[]; }
export interface RelItem { pos?: string; words?: { word?: string; tran?: string }[]; }
export interface RelWordData { rels?: { rel?: RelItem; }[]; }

// --- 4. Etymology ---
export interface EtymItem { 
    value?: string; // Changed from 'word' based on user feedback
    desc?: string; 
    source?: string;
    url?: string; 
}
export interface EtymData { 
    etyms?: { 
        zh?: EtymItem[]; // Changed to Array
        en?: EtymItem[]; // Changed to Array
    }; 
}

// --- 5. Sentences (Bilingual & Media) ---
export interface SentencePair { "sentence-eng"?: string; "sentence-translation"?: string; "sentence-speech"?: string; source?: string; }
export interface BilingualSentenceData { "sentence-pair"?: SentencePair[]; }

export interface MediaSentSnippet { name?: string; source?: string; streamUrl?: string; imageUrl?: string; sw?: string; } // sw = sentence word highlight?
export interface MediaSentItem { eng?: string; chn?: string; snippets?: { snippet?: MediaSentSnippet[] }; }
export interface MediaSentsPartData { sent?: MediaSentItem[]; }

// --- 6. EE (English-English) ---
export interface EeItem { pos?: string; tr?: { l?: { i?: string }; "similar-words"?: string[] }[]; }
export interface EeData { word?: { trs?: EeItem[] }; }

// --- 7. Images (pic_dict) ---
export interface PicItem { image?: string; host?: string; }
export interface PicDictData { pic?: PicItem[]; }

// --- 8. Videos (word_video, video_sents) ---
export interface WordVideoItem { video?: { title?: string; cover?: string; url?: string; }; }
export interface WordVideoData { word_videos?: WordVideoItem[]; }

export interface VideoSentItem { 
    // Legacy fields
    sents?: { eng?: string; chn?: string }[]; 
    cover?: string; 
    url?: string; 
    source?: string;
    
    // New fields for sents_data
    video_cover?: string;
    video?: string;
    subtitle_srt?: string;
    contributor?: string;
}
export interface VideoSentsData { 
    video_sent?: VideoSentItem[]; 
    sents_data?: VideoSentItem[]; // Added sents_data support
}

// --- 9. Music (music_sents) ---
export interface MusicSentItem { 
    // Field names from user feedback
    link?: string;            // Original song link (Full)
    playUrl?: string;         // Snippet Audio
    coverImg?: string;        // Cover Image
    lyric?: string;           // Lyric (HTML)
    lyricTranslation?: string;// Lyric Translation
    singer?: string;          // Artist
    songName?: string;        // Title
    
    // Updated: Lyric List Structure
    lyricList?: { 
        lyric?: string; 
        lyricTranslation?: string 
    }[]; 

    // Legacy / Fallback fields
    sents?: { eng?: string; chn?: string }[]; 
    song_name?: string; 
    url?: string; 
    cover?: string;
}
export interface MusicSentsData { 
    music_sent?: MusicSentItem[]; 
    sents_data?: MusicSentItem[]; // Alternative field name often used by API
}

// --- 10. Wikipedia & Web Trans ---
export interface WikiDigestData { summarys?: { summary?: string; key?: string }[]; source?: { name?: string; url?: string }; }

// Updated Web Trans Types
export interface WebTransItem { 
    key?: string; 
    "key-speech"?: string;
    trans?: { 
        value?: string; 
        support?: number;
        cls?: { cl?: string[] };
        summary?: { line?: string[] };
    }[]; 
}
export interface WebTransData { "web-translation"?: WebTransItem[]; }

// --- 11. Exams (individual) ---
export interface QuestionTypeInfo {
    type?: string;
    time?: number;
}

export interface PastExamSent {
    en?: string;
    zh?: string;
    source?: string;
}

export interface IdiomaticItem {
    colloc?: {
        en?: string;
        zh?: string;
    };
}

export interface IndividualData {
    examInfo?: {
        questionTypeInfo?: QuestionTypeInfo[];
    };
    pastExamSents?: PastExamSent[];
    idiomatic?: IdiomaticItem[];
}

// --- 12. Special (Stats & Specialized Meanings) ---
export interface SpecialTrItem {
    tr?: {
        engSent?: string;
        chnSent?: string;
        nat?: string;
        docTitle?: string;
    }
}

export interface SpecialEntryItem {
    entry?: {
        major?: string;
        trs?: SpecialTrItem[];
    }
}

export interface SpecialData { 
    summary?: { sources?: { [key:string]: { hits: number } } }; 
    co_list?: { gene?: string; entries?: { k?: string; v?: string }[] }[];
    entries?: SpecialEntryItem[]; // Added specialized entries
}

// Root Response
export interface YoudaoResponse {
  ec?: EcData;
  expand_ec?: ExpandEcData;
  collins?: CollinsData;
  collins_primary?: CollinsPrimaryData;
  ee?: EeData;
  
  phrs?: PhrsData;
  syno?: SynoData;
  rel_word?: RelWordData;
  etym?: EtymData;
  
  blng_sents_part?: BilingualSentenceData;
  media_sents_part?: MediaSentsPartData;
  video_sents?: VideoSentsData;
  music_sents?: MusicSentsData;
  word_video?: WordVideoData;
  
  pic_dict?: PicDictData;
  wikipedia_digest?: WikiDigestData;
  web_trans?: WebTransData;
  
  special?: SpecialData;
  individual?: IndividualData;
  discrim?: { discrims?: { title?: string; desc?: string }[] };
}
