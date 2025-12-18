
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, BookOpen, Star, Layers, Share2, Quote, GitBranch, Globe, Loader2, History, Split, Hash, Image as ImageIcon, Youtube, Music, Tv, FileQuestion, Network, Volume2, Briefcase, GripVertical } from 'lucide-react';
import { YoudaoResponse } from '../types/youdao';
import { BasicInfo } from './word-detail/BasicInfo';
import { ImageGallery } from './word-detail/ImageGallery';
import { ExpandEcSection } from './word-detail/ExpandEcSection';
import { CollinsPrimarySection, CollinsOldSection } from './word-detail/CollinsSection';
import { EeSection } from './word-detail/EeSection';
import { VideoLectureSection, VideoSceneSection, MusicSection } from './word-detail/MediaSection';
import { PhrasesSection, SynonymsSection, DiscrimSection, RootsSection, EtymSection } from './word-detail/RelationshipSection';
import { BilingualSentencesSection, MediaSentencesSection } from './word-detail/SentenceSection';
import { WebTransSection, ExamsSection, WikiSection } from './word-detail/WebSection';
import { SpecialSection } from './word-detail/SpecialSection';
import { interactionConfigStorage } from '../utils/storage';
import { DEFAULT_WORD_INTERACTION } from '../constants';

interface WordDetailProps {
  word: string;
  onBack: () => void;
}

// --- Navigation Config (Default Order) ---
const DEFAULT_SECTIONS = [
  { id: 'basic', label: '基础释义', icon: Hash },
  { id: 'images', label: '单词配图', icon: ImageIcon },
  { id: 'expand_ec', label: '扩展释义', icon: BookOpen },
  { id: 'special', label: '专业释义', icon: Briefcase },
  { id: 'collins_primary', label: '柯林斯 (新)', icon: Star },
  { id: 'collins_old', label: '柯林斯 (旧)', icon: Star },
  { id: 'ee', label: '英英释义', icon: Globe },
  { id: 'video_lecture', label: '视频讲解', icon: Youtube },
  { id: 'video_scene', label: '实景视频', icon: Tv },
  { id: 'music', label: '原声歌曲', icon: Music },
  { id: 'phrases', label: '常用词组', icon: Layers },
  { id: 'synonyms', label: '同近义词', icon: Share2 },
  { id: 'discrim', label: '词义辨析', icon: Split },
  { id: 'roots', label: '词根词源', icon: GitBranch },
  { id: 'etym', label: '词源典故', icon: History },
  { id: 'sentences', label: '双语例句', icon: Quote },
  { id: 'media_sents', label: '原声例句', icon: Volume2 },
  { id: 'exams', label: '考试真题', icon: FileQuestion },
  { id: 'web_trans', label: '网络释义', icon: Network },
  { id: 'wiki', label: '维基百科', icon: BookOpen },
];

export const WordDetail: React.FC<WordDetailProps> = ({ word, onBack }) => {
  const [data, setData] = useState<YoudaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  
  // Navigation Order State
  const [navItems, setNavItems] = useState(DEFAULT_SECTIONS);
  const [draggedNavIndex, setDraggedNavIndex] = useState<number | null>(null);

  // Interaction Config for Web Link
  const [interactionConfig, setInteractionConfig] = useState(DEFAULT_WORD_INTERACTION);

  // Intersection Observer
  const observer = useRef<IntersectionObserver | null>(null);

  // Load Configs
  useEffect(() => {
      // Nav Order
      const savedOrder = localStorage.getItem('context-lingo-nav-order');
      if (savedOrder) {
          try {
              const orderIds = JSON.parse(savedOrder) as string[];
              // Reorder DEFAULT_SECTIONS based on saved IDs, appending any new sections at the end
              const reordered = [
                  ...orderIds.map(id => DEFAULT_SECTIONS.find(s => s.id === id)).filter(Boolean),
                  ...DEFAULT_SECTIONS.filter(s => !orderIds.includes(s.id))
              ] as typeof DEFAULT_SECTIONS;
              setNavItems(reordered);
          } catch (e) {
              console.error("Failed to load nav order", e);
          }
      }

      // Interaction Config (for Online Dictionary URL)
      interactionConfigStorage.getValue().then(setInteractionConfig);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`);
        if (!res.ok) throw new Error('API request failed');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError('无法加载词典数据，请检查网络连接。');
      } finally {
        setLoading(false);
      }
    };

    if (word) fetchData();
  }, [word]);

  // Compute Web URL
  const webUrl = useMemo(() => {
      if (interactionConfig.onlineDictUrl) {
          return interactionConfig.onlineDictUrl.replace(/{word}/g, encodeURIComponent(word));
      }
      return `https://dict.youdao.com/result?word=${encodeURIComponent(word)}&lang=en`;
  }, [interactionConfig.onlineDictUrl, word]);

  // Helper to determine which sections have data
  const hasData = (id: string) => {
      if (!data) return false;
      switch(id) {
          case 'basic': return !!data.ec;
          case 'images': return (data.pic_dict?.pic?.length || 0) > 0;
          case 'expand_ec': return (data.expand_ec?.word?.length || 0) > 0;
          case 'special': return (data.special?.entries?.length || 0) > 0;
          case 'collins_primary': return (data.collins_primary?.gramcat?.length || 0) > 0;
          case 'collins_old': return (data.collins?.collins_entries?.length || 0) > 0;
          case 'ee': return (data.ee?.word?.trs?.length || 0) > 0;
          case 'video_lecture': return (data.word_video?.word_videos?.length || 0) > 0;
          case 'video_scene': return (data.video_sents?.sents_data?.length || data.video_sents?.video_sent?.length || (data.video_sents as any)?.sent?.length || 0) > 0;
          case 'music': return (data.music_sents?.sents_data?.length || data.music_sents?.music_sent?.length || (data.music_sents as any)?.songs?.length || 0) > 0;
          case 'phrases': return (data.phrs?.phrs?.length || 0) > 0;
          case 'synonyms': return (data.syno?.synos?.length || 0) > 0;
          case 'roots': return (data.rel_word?.rels?.length || 0) > 0;
          case 'etym': return !!(data.etym?.etyms?.zh || data.etym?.etyms?.en);
          case 'sentences': return (data.blng_sents_part?.["sentence-pair"]?.length || 0) > 0;
          case 'media_sents': return (data.media_sents_part?.sent?.length || 0) > 0;
          case 'exams': return !!(data.individual?.examInfo?.questionTypeInfo?.length || data.individual?.pastExamSents?.length || data.individual?.idiomatic?.length);
          case 'web_trans': return (data.web_trans?.["web-translation"]?.length || (data.web_trans as any)?.["web_translation"]?.length || 0) > 0;
          case 'wiki': return (data.wikipedia_digest?.summarys?.length || 0) > 0;
          case 'discrim': return (data.discrim?.discrims?.length || 0) > 0;
          default: return false;
      }
  };

  // Only show sections that have data
  const activeSectionsList = useMemo(() => {
      return navItems.filter(s => hasData(s.id));
  }, [navItems, data]);

  // Render Mapping Logic
  const renderSectionContent = (id: string) => {
      if (!data) return null;
      switch(id) {
          case 'basic': return <BasicInfo word={word} ec={data.ec} />;
          case 'images': return <ImageGallery word={word} picDict={data.pic_dict} />;
          case 'expand_ec': return <ExpandEcSection expandEc={data.expand_ec} />;
          case 'special': return <SpecialSection special={data.special} />;
          case 'collins_primary': return <CollinsPrimarySection collinsPrimary={data.collins_primary} oldStar={data.collins?.collins_entries?.[0]?.star} />;
          case 'collins_old': return <CollinsOldSection collinsOld={data.collins} word={word} />;
          case 'ee': return <EeSection ee={data.ee} />;
          case 'video_lecture': return <VideoLectureSection wordVideos={data.word_video} />;
          case 'video_scene': return <VideoSceneSection videoSents={data.video_sents} />;
          case 'music': return <MusicSection musicSents={data.music_sents} />;
          case 'phrases': return <PhrasesSection phrs={data.phrs} />;
          case 'synonyms': return <SynonymsSection syno={data.syno} />;
          case 'discrim': return <DiscrimSection discrim={data.discrim} />;
          case 'roots': return <RootsSection relWord={data.rel_word} />;
          case 'etym': return <EtymSection etym={data.etym} />;
          case 'sentences': return <BilingualSentencesSection bilingual={data.blng_sents_part} />;
          case 'media_sents': return <MediaSentencesSection media={data.media_sents_part} />;
          case 'exams': return <ExamsSection individual={data.individual} />;
          case 'web_trans': return <WebTransSection webTrans={data.web_trans} />;
          case 'wiki': return <WikiSection wiki={data.wikipedia_digest} />;
          default: return null;
      }
  };

  // Scroll Spy Logic - Adjusted to find elements by ID directly
  useEffect(() => {
    if (loading || !data) return;
    if (observer.current) observer.current.disconnect();

    const options = {
      root: null,
      rootMargin: '-10% 0px -80% 0px', // Trigger when section is near top
      threshold: 0
    };

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, options);

    // Observe all active section elements
    activeSectionsList.forEach(section => {
        const el = document.getElementById(section.id);
        if (el) observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, [data, loading, activeSectionsList]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  // Drag Handlers
  const handleDragStart = (index: number) => {
      setDraggedNavIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedNavIndex === null || draggedNavIndex === index) return;
      
      const newItems = [...navItems];
      const draggedItem = newItems[draggedNavIndex];
      newItems.splice(draggedNavIndex, 1);
      newItems.splice(index, 0, draggedItem);
      
      setNavItems(newItems);
      setDraggedNavIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedNavIndex(null);
      // Save order
      const orderIds = navItems.map(item => item.id);
      localStorage.setItem('context-lingo-nav-order', JSON.stringify(orderIds));
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">正在深度查询 "{word}" 的全科释义...</p>
        </div>
    );
  }

  if (error || !data) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col p-8">
              <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
                  <BookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">查询失败</h2>
                  <p className="text-slate-500 mb-6">{error || '未找到该单词的详细释义。'}</p>
                  <button onClick={onBack} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">
                      返回上一页
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* 1. Navbar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center shadow-sm">
          <button onClick={onBack} className="p-2 -ml-2 mr-4 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 capitalize truncate font-serif">{word}</h1>
          <div className="ml-auto flex items-center gap-3">
              <a href={webUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium hover:underline flex items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition">
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> 网页版
              </a>
          </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* 2. Left Sidebar Navigation (Sortable) */}
              <nav className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-1">
                      {activeSectionsList.map((section, index) => {
                          // Find original index in full list for drag handling
                          const fullIndex = navItems.findIndex(s => s.id === section.id);
                          
                          return (
                            <div
                                key={section.id}
                                draggable
                                onDragStart={() => handleDragStart(fullIndex)}
                                onDragOver={(e) => handleDragOver(e, fullIndex)}
                                onDragEnd={handleDragEnd}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group cursor-pointer ${
                                    activeSection === section.id 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                                } ${draggedNavIndex === fullIndex ? 'opacity-50 border-2 border-dashed border-blue-400' : ''}`}
                            >
                                <GripVertical className={`w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing ${activeSection === section.id ? 'text-blue-200' : 'text-slate-300'}`} />
                                <section.icon className={`w-4 h-4 mr-3 ${activeSection === section.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                {section.label}
                            </div>
                          );
                      })}
                  </div>
              </nav>

              {/* 3. Main Content Area */}
              <div className="flex-1 w-full space-y-8 min-w-0">
                  {/* Dynamic Section Rendering based on Sort Order */}
                  {activeSectionsList.map(section => (
                      <div id={section.id} key={section.id} className="scroll-mt-24">
                          {renderSectionContent(section.id)}
                      </div>
                  ))}

                  <div className="text-center py-8 text-slate-400 text-xs">
                      © ContextLingo - Data Sources: Youdao, Collins, Wikipedia
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
