
let cachedVoices: SpeechSynthesisVoice[] = [];
let isLoaded = false;
let currentAudio: HTMLAudioElement | null = null; // Track currently playing HTML5 Audio

/**
 * Preloads voices as early as possible.
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
 * Stops all currently playing audio (TTS and HTML5 Audio).
 */
export const stopAudio = () => {
  // 1. Stop TTS
  const synth = window.speechSynthesis;
  synth.cancel();
  
  // 2. Stop HTML5 Audio
  if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0; // Reset position
      currentAudio = null;
  }
};

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
 * Plays arbitrary URL audio with a promise wrapper.
 * Stops any previously playing audio.
 */
export const playUrl = (url: string, playbackRate: number = 1.0): Promise<void> => {
    stopAudio(); // Stop overlapping audio

    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio; // Register as current
        
        audio.playbackRate = playbackRate;
        
        audio.onended = () => {
            if (currentAudio === audio) currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            if (currentAudio === audio) currentAudio = null;
            reject(e);
        };
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (currentAudio === audio) currentAudio = null;
                reject(error);
            });
        }
    });
};

/**
 * Standard Browser TTS (Fallback)
 */
export const playTextToSpeech = async (text: string, accent: 'US' | 'UK' = 'US', rate: number = 1.0, repeat: number = 1) => {
  if (!text || repeat <= 0) return;
  stopAudio(); // Ensure other audio stops

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
 * Smart Audio Player: Youdao Online Stream -> TTS Fallback
 */
export const playWordAudio = async (text: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    if (!text) return;
    
    // Type 1 = UK, Type 2 = US (Youdao convention)
    const type = accent === 'UK' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;

    try {
        await playUrl(url, speed);
    } catch (e) {
        console.warn(`Online audio failed for ${text}, falling back to TTS`, e);
        playTextToSpeech(text, accent, speed);
    }
};

/**
 * Smart Sentence Player.
 */
export const playSentenceAudio = async (text: string, explicitUrl?: string, accent: 'US' | 'UK' = 'US', speed: number = 1.0) => {
    if (explicitUrl) {
        try {
            await playUrl(explicitUrl, speed);
            return;
        } catch(e) { console.warn("Explicit URL failed"); }
    }

    // Try Youdao for sentences
    const type = accent === 'UK' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;
    
    try {
        await playUrl(url, speed);
    } catch (e) {
        playTextToSpeech(text, accent, speed);
    }
};
