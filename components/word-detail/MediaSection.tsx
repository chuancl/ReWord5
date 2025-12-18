
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Youtube, Tv, Music, ExternalLink, PlayCircle, Disc, Mic2, PauseCircle, ArrowLeft, ArrowRight, User, Link as LinkIcon, Maximize2, X, Minimize2, Repeat, Repeat1, Shuffle, ListMusic, ChevronDown, ChevronUp } from 'lucide-react';
import { WordVideoData, VideoSentsData, MusicSentsData, MusicSentItem } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';
import { playUrl, stopAudio as stopGlobalAudio } from '../../utils/audio';

// --- 1. Video Lectures Section ---
export const VideoLectureSection: React.FC<{ wordVideos?: WordVideoData }> = ({ wordVideos }) => {
    const videos = wordVideos?.word_videos || [];
    const [activeLectureIndex, setActiveLectureIndex] = useState(0);
    const [isLecturePlaying, setIsLecturePlaying] = useState(false);

    useEffect(() => { stopGlobalAudio(); setIsLecturePlaying(false); }, [activeLectureIndex]);

    if (videos.length === 0) return null;

    const activeLecture = videos[activeLectureIndex];

    const handlePrev = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveLectureIndex(p => Math.max(0, p - 1)); };
    const handleNext = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveLectureIndex(p => Math.min(videos.length - 1, p + 1)); };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-100 bg-red-50/30">
                <Youtube className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-800">视频讲解</h3>
                <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full ml-auto">
                    {activeLectureIndex + 1} / {videos.length}
                </span>
            </div>
            
            <div className="relative w-full h-[520px] bg-slate-900 flex items-center justify-center overflow-hidden perspective-1000 group select-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
                    {activeLecture?.video?.cover && <img src={activeLecture.video.cover} className="w-full h-full object-cover opacity-10 blur-xl scale-110" />}
                </div>

                {videos.map((v, idx) => {
                    const offset = idx - activeLectureIndex;
                    const absOffset = Math.abs(offset);
                    if (absOffset > 2) return null;

                    const isActive = offset === 0;
                    const xTranslate = offset * 65; 
                    const scale = isActive ? 1 : 1 - (absOffset * 0.15);
                    const rotateY = offset > 0 ? -30 : (offset < 0 ? 30 : 0);
                    const zIndex = 20 - absOffset;
                    const opacity = isActive ? 1 : 0.5;

                    return (
                        <div key={idx} onClick={() => setActiveLectureIndex(idx)} className={`absolute w-[90vw] aspect-video sm:w-[750px] sm:h-[422px] rounded-xl shadow-2xl transition-all duration-500 ease-out cursor-pointer ${isActive ? 'z-30 ring-1 ring-white/20' : 'z-10 hover:opacity-80'}`} style={{ left: '50%', transform: `translateX(calc(-50% + ${xTranslate}%)) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`, zIndex, opacity }}>
                            <div className={`w-full h-full rounded-xl overflow-hidden bg-black relative border border-white/10 group/card`}>
                                {isActive && isLecturePlaying ? (
                                    <video src={v.video?.url} controls autoPlay className="w-full h-full object-contain" onEnded={() => setIsLecturePlaying(false)} controlsList="nodownload" />
                                ) : (
                                    <>
                                        {v.video?.cover ? <img src={v.video.cover} className="w-full h-full object-cover opacity-90" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><Youtube className="w-16 h-16 text-slate-600" /></div>}
                                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent"><h4 className="text-white font-bold text-lg md:text-xl drop-shadow-md line-clamp-2">{v.video?.title}</h4></div>
                                        {isActive && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition group/play" onClick={(e) => { e.stopPropagation(); setIsLecturePlaying(true); stopGlobalAudio(); }}>
                                                <div className="w-20 h-20 rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform hover:scale-110 shadow-xl"><PlayCircle className="w-10 h-10 text-white fill-white ml-1" /></div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {videos.length > 1 && (
                    <>
                        <button onClick={handlePrev} disabled={activeLectureIndex === 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition z-40 backdrop-blur-sm"><ArrowLeft className="w-8 h-8" /></button>
                        <button onClick={handleNext} disabled={activeLectureIndex === videos.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition z-40 backdrop-blur-sm"><ArrowRight className="w-8 h-8" /></button>
                    </>
                )}
            </div>
            <SourceBadge source="word_video" />
        </div>
    );
};

// --- 2. Video Scenes Section ---
export const VideoSceneSection: React.FC<{ videoSents?: VideoSentsData }> = ({ videoSents }) => {
    const realVideos = videoSents?.sents_data || videoSents?.video_sent || (videoSents as any)?.sent || [];
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [subtitleTrackUrl, setSubtitleTrackUrl] = useState<string | null>(null);

    useEffect(() => { stopGlobalAudio(); setIsVideoPlaying(false); }, [activeVideoIndex]);

    const activeVideo = realVideos[activeVideoIndex];

    useEffect(() => {
        if (!activeVideo) { setSubtitleTrackUrl(null); return; }
        let vttContent = "WEBVTT\n\n";
        let hasContent = false;
        if (activeVideo.subtitle_srt) {
            vttContent += activeVideo.subtitle_srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2').replace(/<[^>]+>/g, '');
            hasContent = true;
        } else if (activeVideo.sents && activeVideo.sents.length > 0) {
            const combinedText = activeVideo.sents.map((s: any) => `${s.eng || ''}\n${s.chn || ''}`).join('\n\n');
            vttContent += `1\n00:00.000 --> 10:00.000\n${combinedText}`;
            hasContent = true;
        }
        if (hasContent) {
            const blob = new Blob([vttContent], { type: 'text/vtt' });
            const url = URL.createObjectURL(blob);
            setSubtitleTrackUrl(url);
            return () => URL.revokeObjectURL(url);
        } else { setSubtitleTrackUrl(null); }
    }, [activeVideo]);

    if (realVideos.length === 0) return null;

    const handlePrev = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveVideoIndex(p => Math.max(0, p - 1)); };
    const handleNext = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveVideoIndex(p => Math.min(realVideos.length - 1, p + 1)); };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-100 bg-purple-50/30">
                <Tv className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-800">实景视频</h3>
                <span className="text-xs text-purple-500 font-medium bg-purple-50 px-2 py-0.5 rounded-full ml-auto">
                    {activeVideoIndex + 1} / {realVideos.length}
                </span>
            </div>
            <div className="relative w-full h-[520px] bg-slate-900 flex items-center justify-center overflow-hidden perspective-1000 group select-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
                    {activeVideo && (activeVideo.video_cover || activeVideo.cover) && <img src={activeVideo.video_cover || activeVideo.cover} className="w-full h-full object-cover opacity-10 blur-xl scale-110" />}
                </div>
                {realVideos.map((v: any, idx: number) => {
                    const offset = idx - activeVideoIndex;
                    const absOffset = Math.abs(offset);
                    if (absOffset > 2) return null;
                    const isActive = offset === 0;
                    const xTranslate = offset * 65; 
                    const scale = isActive ? 1 : 1 - (absOffset * 0.15);
                    const rotateY = offset > 0 ? -30 : (offset < 0 ? 30 : 0);
                    const zIndex = 20 - absOffset;
                    const opacity = isActive ? 1 : 0.5;
                    return (
                        <div key={idx} onClick={() => setActiveVideoIndex(idx)} className={`absolute w-[90vw] aspect-video sm:w-[750px] sm:h-[422px] rounded-xl shadow-2xl transition-all duration-500 ease-out cursor-pointer ${isActive ? 'z-30 ring-1 ring-white/20' : 'z-10 hover:opacity-80'}`} style={{ left: '50%', transform: `translateX(calc(-50% + ${xTranslate}%)) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`, zIndex, opacity }}>
                            <div className={`w-full h-full rounded-xl overflow-hidden bg-black relative border border-white/10 group/card`}>
                                {isActive && isVideoPlaying ? (
                                    <video src={v.video || v.url} controls autoPlay className="w-full h-full object-contain" onEnded={() => setIsVideoPlaying(false)} controlsList="nodownload">
                                        {subtitleTrackUrl && <track key={subtitleTrackUrl} default kind="captions" srcLang="en" label="English/Chinese" src={subtitleTrackUrl} />}
                                    </video>
                                ) : (
                                    <>
                                        {(v.video_cover || v.cover) ? <img src={v.video_cover || v.cover} className="w-full h-full object-cover opacity-90" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><Tv className="w-16 h-16 text-slate-600" /></div>}
                                        {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition group/play" onClick={(e) => { e.stopPropagation(); setIsVideoPlaying(true); stopGlobalAudio(); }}><div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform hover:scale-110"><PlayCircle className="w-12 h-12 text-white ml-1" /></div></div>}
                                        {isActive && !isVideoPlaying && (
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                                                <div className="text-center">
                                                    {v.sents && v.sents.length > 0 ? v.sents.map((s: any, i: number) => <div key={i} className="mb-2 last:mb-0"><p className="text-white text-lg md:text-xl font-bold leading-tight drop-shadow-md font-serif italic">"{s.eng}"</p>{s.chn && <p className="text-white/80 text-sm md:text-base mt-1 font-medium drop-shadow-md">{s.chn}</p>}</div>) : v.subtitle_srt ? <p className="text-white text-base font-medium drop-shadow-md line-clamp-3 leading-relaxed">{v.subtitle_srt.replace(/(\d{2}:\d{2}:\d{2},\d{3})|(\d+\s+)|(-->)/g, '').replace(/<[^>]+>/g, '')}</p> : null}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {realVideos.length > 1 && (<><button onClick={handlePrev} disabled={activeVideoIndex === 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition z-40 backdrop-blur-sm"><ArrowLeft className="w-8 h-8" /></button><button onClick={handleNext} disabled={activeVideoIndex === realVideos.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition z-40 backdrop-blur-sm"><ArrowRight className="w-8 h-8" /></button></>)}
            </div>
            {activeVideo && (
                <div className="bg-white px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">{(activeVideo.contributor || activeVideo.source) && <div className="flex items-center text-xs text-slate-500"><User className="w-3.5 h-3.5 mr-1.5 text-slate-400" /><span>{activeVideo.contributor || activeVideo.source}</span></div>}</div>
                    {(activeVideo.video || activeVideo.url) && <a href={activeVideo.video || activeVideo.url} target="_blank" rel="noreferrer" className="flex items-center text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"><LinkIcon className="w-3.5 h-3.5 mr-1.5" />原始链接</a>}
                </div>
            )}
            <SourceBadge source="video_sents" />
        </div>
    );
};

// --- 3. Music Section (Enhanced with In-Place Expansion & Controls) ---
export const MusicSection: React.FC<{ musicSents?: MusicSentsData }> = ({ musicSents }) => {
    const musicList: MusicSentItem[] = musicSents?.sents_data || musicSents?.music_sent || (musicSents as any)?.songs || [];
    const [activeMusicIndex, setActiveMusicIndex] = useState(0);
    
    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Playback Modes
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoPlayRef = useRef(false);

    // Initialize Audio Element
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;
        
        const updateProgress = () => {
            if (audio.duration) {
                setDuration(audio.duration);
                setCurrentTime(audio.currentTime);
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateProgress);
        };
    }, []);

    // Handle Song Change
    useEffect(() => {
        if (musicList.length > 0 && audioRef.current) {
            const url = musicList[activeMusicIndex]?.playUrl || musicList[activeMusicIndex]?.url;
            if (url) {
                audioRef.current.src = url;
                audioRef.current.load();
                
                if (shouldAutoPlayRef.current) {
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("AutoPlay error", e));
                } else {
                    setIsPlaying(false);
                }
                setProgress(0);
            }
        }
    }, [activeMusicIndex, musicList]);

    // Navigation Logic
    const playNext = useCallback(() => {
        if (!audioRef.current) return;
        shouldAutoPlayRef.current = true;

        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        let nextIndex;
        if (isShuffle) {
            // Pick random index that isn't current (unless list length is 1)
            if (musicList.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * musicList.length);
                } while (nextIndex === activeMusicIndex);
            } else {
                nextIndex = 0;
            }
        } else {
            nextIndex = activeMusicIndex + 1;
            if (nextIndex >= musicList.length) {
                if (repeatMode === 'all') {
                    nextIndex = 0; // Loop back
                } else {
                    // Stop at end
                    setIsPlaying(false);
                    shouldAutoPlayRef.current = false;
                    return;
                }
            }
        }
        setActiveMusicIndex(nextIndex);
    }, [activeMusicIndex, isShuffle, repeatMode, musicList.length]);

    const playPrev = useCallback(() => {
        shouldAutoPlayRef.current = true;
        let prevIndex = activeMusicIndex - 1;
        if (prevIndex < 0) {
            prevIndex = musicList.length - 1; // Wrap around
        }
        setActiveMusicIndex(prevIndex);
    }, [activeMusicIndex, musicList.length]);

    // Listen to 'ended' event to trigger auto-next
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNext();
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [playNext, repeatMode]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                shouldAutoPlayRef.current = false;
            } else {
                stopGlobalAudio();
                audioRef.current.play().catch(e => console.error("Play error:", e));
                shouldAutoPlayRef.current = true;
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current && audioRef.current.duration) {
            audioRef.current.currentTime = (val / 100) * audioRef.current.duration;
            setProgress(val);
        }
    };

    const toggleShuffle = () => setIsShuffle(!isShuffle);
    
    const toggleRepeat = () => {
        if (repeatMode === 'off') setRepeatMode('all');
        else if (repeatMode === 'all') setRepeatMode('one');
        else setRepeatMode('off');
    };

    if (musicList.length === 0) return null;

    const activeMusic = musicList[activeMusicIndex];

    const handleCardPrev = (e?: React.MouseEvent) => { e?.stopPropagation(); playPrev(); };
    const handleCardNext = (e?: React.MouseEvent) => { e?.stopPropagation(); playNext(); };

    // Helper for formatting time
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Auto-scroll logic for Expanded Player
    useEffect(() => {
        if (isExpanded && isPlaying && lyricsContainerRef.current) {
            const container = lyricsContainerRef.current;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            if (scrollHeight > 0) {
                const targetScroll = (progress / 100) * scrollHeight;
                container.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }
    }, [progress, isExpanded, isPlaying]);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-500 ease-in-out ${isExpanded ? 'min-h-[600px] bg-slate-950 border-slate-900' : ''}`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-8 py-5 border-b transition-colors duration-300 ${isExpanded ? 'border-white/10 bg-slate-950' : 'border-slate-100 bg-pink-50/30'}`}>
                <Music className={`w-5 h-5 ${isExpanded ? 'text-pink-500' : 'text-pink-500'}`} />
                <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-white' : 'text-slate-800'}`}>原声歌曲</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-auto transition-colors ${isExpanded ? 'text-pink-300 bg-white/10' : 'text-pink-400 bg-pink-50'}`}>
                    {activeMusicIndex + 1} / {musicList.length}
                </span>
                {isExpanded && (
                    <button 
                        onClick={() => setIsExpanded(false)} 
                        className="ml-3 p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition"
                        title="收起播放器"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* --- Content Switching --- */}
            {!isExpanded ? (
                /* Compact Mode Content */
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Cover Flow */}
                    <div className="relative w-full h-[320px] bg-slate-900 flex items-center justify-center overflow-hidden perspective-1000 group select-none">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800/90">
                            {(activeMusic.coverImg || activeMusic.cover) && <img src={activeMusic.coverImg || activeMusic.cover} className="w-full h-full object-cover opacity-20 blur-2xl scale-110" />}
                        </div>
                        {musicList.map((m, idx) => {
                            const offset = idx - activeMusicIndex;
                            const absOffset = Math.abs(offset);
                            if (absOffset > 2) return null;
                            const isActive = offset === 0;
                            const xTranslate = offset * 60; 
                            const scale = isActive ? 1 : 1 - (absOffset * 0.2);
                            const rotateY = offset > 0 ? -45 : (offset < 0 ? 45 : 0);
                            const zIndex = 20 - absOffset;
                            const opacity = isActive ? 1 : 0.6;
                            return (
                                <div key={idx} onClick={() => setActiveMusicIndex(idx)} className={`absolute w-48 h-48 sm:w-56 sm:h-56 rounded-xl shadow-2xl transition-all duration-500 ease-out cursor-pointer ${isActive ? 'z-30 ring-1 ring-white/20' : 'z-10 hover:opacity-80'}`} style={{ transform: `translateX(${xTranslate}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`, zIndex, opacity, left: '50%', marginLeft: '-7rem' }}>
                                    <div className={`w-full h-full rounded-xl overflow-hidden bg-slate-800 relative border border-white/10 ${isActive && isPlaying ? 'animate-pulse-slow' : ''}`}>
                                        {(m.coverImg || m.cover) ? <img src={m.coverImg || m.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-rose-600"><Disc className="w-12 h-12 text-white/50" /></div>}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                                        {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition group/play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}><div className={`w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform ${isPlaying ? 'scale-100' : 'scale-90 group-hover/play:scale-110'}`}>{isPlaying ? <PauseCircle className="w-6 h-6 text-white" /> : <PlayCircle className="w-6 h-6 text-white ml-0.5" />}</div></div>}
                                    </div>
                                </div>
                            );
                        })}
                        {musicList.length > 1 && (<><button onClick={handleCardPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-40 backdrop-blur-sm"><ArrowLeft className="w-6 h-6" /></button><button onClick={handleCardNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-40 backdrop-blur-sm"><ArrowRight className="w-6 h-6" /></button></>)}
                    </div>

                    {/* Lyrics Preview Section */}
                    <div className="px-6 py-6 min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar border-t border-slate-50 bg-slate-50/30">
                        <div className="text-center space-y-4">
                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-slate-800">{activeMusic.songName || activeMusic.song_name || 'Unknown Song'}</h4>
                                <div className="text-xs text-pink-500 font-medium flex items-center justify-center mt-1">
                                    <Mic2 className="w-3 h-3 mr-1" /> {activeMusic.singer || 'Unknown Artist'}
                                </div>
                            </div>

                            {activeMusic.lyricList && activeMusic.lyricList.length > 0 ? (
                                <div className="space-y-4">
                                    {activeMusic.lyricList.map((line, i) => (
                                        <div key={i}>
                                            <p className="text-slate-700 font-medium leading-relaxed font-serif" dangerouslySetInnerHTML={{__html: line.lyric || ''}} />
                                            {line.lyricTranslation && <p className="text-xs text-slate-500 mt-0.5">{line.lyricTranslation}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (activeMusic.lyric || activeMusic.sents) ? (
                                <div className="text-slate-700 text-sm leading-relaxed font-serif whitespace-pre-wrap">
                                    {activeMusic.lyric ? (
                                        <div dangerouslySetInnerHTML={{__html: activeMusic.lyric}} />
                                    ) : (
                                        activeMusic.sents?.map((s: any, i: number) => (
                                            <div key={i} className="mb-3">
                                                <p className="font-medium">"{s.eng}"</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{s.chn}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs italic py-4">暂无歌词预览</p>
                            )}
                        </div>
                    </div>

                    {/* Mini Player Bar */}
                    <div className="bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 sticky bottom-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{animationDuration: '10s'}}>
                                {(activeMusic.coverImg || activeMusic.cover) ? <img src={activeMusic.coverImg || activeMusic.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-pink-100 flex items-center justify-center"><Music className="w-6 h-6 text-pink-300"/></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="truncate pr-4">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{activeMusic.songName || activeMusic.song_name || 'Unknown Song'}</h4>
                                        <p className="text-xs text-slate-500 truncate">{activeMusic.singer || 'Unknown Artist'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={togglePlay} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition">
                                            {isPlaying ? <PauseCircle className="w-6 h-6 fill-pink-50 text-pink-600"/> : <PlayCircle className="w-6 h-6 fill-slate-50 text-slate-600"/>}
                                        </button>
                                        <button onClick={() => setIsExpanded(true)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition" title="展开/查看完整歌词">
                                            <Maximize2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full relative group cursor-pointer">
                                        <div className="absolute inset-y-0 left-0 bg-pink-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                        <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                    <span>{formatTime(duration || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Expanded Player View (Embedded in Place) */
                <div className="w-full bg-slate-950 text-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-8 overflow-hidden min-h-[500px]">
                        {/* Left: Vinyl Cover */}
                        <div className="w-full md:w-1/2 flex items-center justify-center flex-col gap-8">
                            <div className={`relative w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full border-8 border-white/5 shadow-2xl overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`} style={{animationDuration: '20s', boxShadow: '0 0 50px rgba(0,0,0,0.5)'}}>
                                <div className="absolute inset-0 bg-black rounded-full"></div>
                                {(activeMusic.coverImg || activeMusic.cover) ? 
                                    <img src={activeMusic.coverImg || activeMusic.cover} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-90 scale-105" /> 
                                    : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-900 to-purple-900"><Music className="w-20 h-20 text-white/20"/></div>
                                }
                                {/* Vinyl Shine */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
                                {/* Center Hole */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-black rounded-full"></div>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl md:text-3xl font-bold">{activeMusic.songName || 'Unknown Song'}</h2>
                                <p className="text-lg text-white/60">{activeMusic.singer || 'Unknown Artist'}</p>
                            </div>
                        </div>

                        {/* Right: Lyrics */}
                        <div className="w-full md:w-1/2 h-[350px] md:h-[450px] bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6 relative flex flex-col">
                            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-950/80 to-transparent z-10 pointer-events-none"></div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 text-center py-8" ref={lyricsContainerRef}>
                                {activeMusic.lyricList && activeMusic.lyricList.length > 0 ? (
                                    activeMusic.lyricList.map((line, lIdx) => (
                                        <div key={lIdx} className="space-y-1 group transition-all duration-500 hover:scale-105 opacity-60 hover:opacity-100">
                                            <p className="text-lg md:text-xl font-medium text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: line.lyric || '' }} />
                                            {line.lyricTranslation && <p className="text-sm md:text-base text-pink-200/70">{line.lyricTranslation}</p>}
                                        </div>
                                    ))
                                ) : (activeMusic.lyric || activeMusic.sents) ? (
                                    <div className="text-white/80 text-lg leading-loose font-serif whitespace-pre-wrap">
                                        <div dangerouslySetInnerHTML={{ __html: activeMusic.lyric || '' }} />
                                        {activeMusic.sents?.map((s: any, i: number) => <div key={i} className="mb-4"><p>{s.eng}</p><p className="text-sm text-white/50">{s.chn}</p></div>)}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-white/30">
                                        <ListMusic className="w-12 h-12 mb-4"/>
                                        <p>暂无滚动歌词</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/90 to-transparent z-10 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Footer Controls (Expanded) */}
                    <div className="bg-slate-900/50 backdrop-blur-md px-8 py-6 border-t border-white/10">
                        <div className="max-w-4xl mx-auto flex flex-col gap-4">
                            {/* Progress */}
                            <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                                <span>{formatTime(currentTime)}</span>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative cursor-pointer group">
                                    <div className="absolute inset-y-0 left-0 bg-pink-500 rounded-full group-hover:bg-pink-400 transition-colors" style={{ width: `${progress}%` }}></div>
                                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                                <span>{formatTime(duration)}</span>
                            </div>

                            {/* Main Buttons */}
                            <div className="flex items-center justify-center gap-10">
                                <button 
                                    onClick={toggleShuffle} 
                                    className={`transition ${isShuffle ? 'text-pink-500' : 'text-white/40 hover:text-white'}`}
                                    title={isShuffle ? "关闭随机播放" : "开启随机播放"}
                                >
                                    <Shuffle className="w-5 h-5"/>
                                </button>
                                
                                <button onClick={playPrev} className="text-white hover:text-pink-400 transition p-2 hover:scale-110 active:scale-95"><ArrowLeft className="w-8 h-8"/></button>
                                
                                <button 
                                    onClick={togglePlay} 
                                    className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition active:scale-95 shadow-lg shadow-white/10 hover:shadow-pink-500/20"
                                >
                                    {isPlaying ? <PauseCircle className="w-8 h-8 fill-slate-900 text-white"/> : <PlayCircle className="w-8 h-8 fill-slate-900 text-white ml-1"/>}
                                </button>
                                
                                <button onClick={playNext} className="text-white hover:text-pink-400 transition p-2 hover:scale-110 active:scale-95"><ArrowRight className="w-8 h-8"/></button>
                                
                                <button 
                                    onClick={toggleRepeat} 
                                    className={`transition ${repeatMode !== 'off' ? 'text-pink-500' : 'text-white/40 hover:text-white'}`}
                                    title={`循环模式: ${repeatMode === 'one' ? '单曲循环' : repeatMode === 'all' ? '列表循环' : '不循环'}`}
                                >
                                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5"/> : <Repeat className="w-5 h-5"/>}
                                </button>
                            </div>

                            {/* External Link Action */}
                            <div className="flex justify-center mt-2">
                                {(activeMusic.link || activeMusic.url) && (
                                    <a 
                                        href={activeMusic.link || activeMusic.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center gap-2 px-6 py-2 bg-pink-600/20 hover:bg-pink-600/40 text-pink-200 rounded-full text-sm font-medium border border-pink-500/30 transition-all hover:scale-105"
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        前往音乐平台收听完整版
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <SourceBadge source="music_sents" />
        </div>
    );
};

// Compatibility export
export const MediaSection: React.FC<any> = (props) => (
    <div className="space-y-8">
        <VideoLectureSection wordVideos={props.wordVideos} />
        <VideoSceneSection videoSents={props.videoSents} />
        <MusicSection musicSents={props.musicSents} />
    </div>
);
