let cachedVoices: SpeechSynthesisVoice[] = [];
let isLoaded = false;
let currentAudio: HTMLAudioElement | null = null; // 追踪当前播放的 HTML5 Audio

/**
 * 尽早加载 TTS 语音包
 */
export const preloadVoices = () => {
  const synth = window.speechSynthesis;
  const updateVoices = () => {
    const voices = synth.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      isLoaded = true;
    }
  };
  updateVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = updateVoices;
  }
};

/**
 * 停止所有正在播放的音频 (TTS 和 HTML5 音频)
 */
export const stopAudio = () => {
  // 1. 停止 TTS
  const synth = window.speechSynthesis;
  synth.cancel();
  
  // 2. 停止 HTML5 音频
  if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = ""; // 彻底释放资源
      currentAudio.load();
      currentAudio = null;
  }
};

/**
 * 用户交互后调用，解锁浏览器的音频限制
 */
export const unlockAudio = () => {
    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0; u.rate = 10; u.text = ' '; 
    synth.speak(u);
};

const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (isLoaded && cachedVoices.length > 0) return Promise.resolve(cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const v = synth.getVoices();
    if (v.length > 0) { cachedVoices = v; isLoaded = true; resolve(v); return; }
    const handler = () => {
      const v = synth.getVoices();
      if (v.length > 0) { cachedVoices = v; isLoaded = true; synth.removeEventListener('voiceschanged', handler); resolve(v); }
    };
    synth.addEventListener('voiceschanged', handler);
    setTimeout(() => { synth.removeEventListener('voiceschanged', handler); resolve(synth.getVoices()); }, 2000);
  });
};

/**
 * 播放 URL 音频。
 * 增加了对浏览器 Autoplay 限制的检测。
 */
export const playUrl = (url: string, playbackRate: number = 1.0): Promise<void> => {
    // 这里不再内部直接调用 stopAudio() 以免死循环，由外部逻辑控制
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        audio.playbackRate = playbackRate;
        
        audio.onended = () => {
            if (currentAudio === audio) currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            if (currentAudio === audio) currentAudio = null;
            reject(new Error("Audio load failed"));
        };
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // 播放成功
            }).catch(error => {
                if (currentAudio === audio) currentAudio = null;
                // 通常是 NotAllowedError，意味着自动播放被拦截
                reject(error);
            });
        }
    });
};

/**
 * 标准浏览器 TTS 兜底播放
 */
export const playTextToSpeech = async (text: string, accent: 'US' | 'UK' = 'US', rate: number = 1.0, repeat: number = 1) => {
  if (!text || repeat <= 0) return;
  stopAudio();

  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();

  try {
      const voices = await waitForVoices();
      const langTag = accent === 'UK' ? 'en-GB' : 'en-US';
      const targetVoice = voices.find(v => v.lang === langTag) || voices.find(v => v.lang.startsWith('en'));

      for (let i = 0; i < repeat; i++) {
        const utterance = new SpeechSynthesisUtterance(text);
        const safeRate = Math.max(0.1, Math.min(10, rate)); 
        utterance.rate = safeRate;
        utterance.pitch = 1.0;
        if (targetVoice) { utterance.voice = targetVoice; utterance.lang = targetVoice.lang; } 
        else { utterance.lang = langTag; }
        synth.speak(utterance);
      }
  } catch (err) {
      console.error("TTS Error", err);
  }
};

/**
 * 核心：智能单词发音播放器
 * 策略：有道词典在线音频优先 -> TTS 兜底
 */
export const playWordAudio = async (text: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    if (!text) return;
    
    // 强制停止当前正在进行的任何播放，确保发音清晰
    stopAudio();

    // Type 1 = UK, Type 2 = US (有道词典约定)
    const type = accent === 'UK' ? 1 : 2;
    // 增加 timestamp 避免缓存导致的播放失效
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}&t=${Date.now()}`;

    try {
        await playUrl(url, speed);
    } catch (e) {
        // 如果在线音频因为自动播放策略被拦截或网络失败，则使用 TTS 兜底
        console.warn(`[ContextLingo] 在线读音不可用或被浏览器拦截: ${text}`, e);
        await playTextToSpeech(text, accent, speed);
    }
};

/**
 * 智能例句朗读
 */
export const playSentenceAudio = async (text: string, explicitUrl?: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    stopAudio();
    if (explicitUrl) {
        try {
            await playUrl(explicitUrl, speed);
            return;
        } catch(e) { console.warn("Explicit URL failed"); }
    }

    const type = accent === 'UK' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}&t=${Date.now()}`;
    
    try {
        await playUrl(url, speed);
    } catch (e) {
        playTextToSpeech(text, accent, speed);
    }
};