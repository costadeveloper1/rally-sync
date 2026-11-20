class SoundManager {
  private isMuted: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    const saved = localStorage.getItem('rally_sync_muted');
    this.isMuted = saved === 'true';

    // Load voices (may be async on some browsers)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer a natural English voice
        this.preferredVoice =
          voices.find((v) => v.lang === 'en-US' && v.name.toLowerCase().includes('natural')) ||
          voices.find((v) => v.lang === 'en-US' && !v.name.toLowerCase().includes('espeak')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0] ||
          null;
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('rally_sync_muted', String(this.isMuted));
    // Cancel any ongoing speech when muting
    if (this.isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Speak a word/phrase using the Web Speech API
   */
  private speak(text: string, rate = 1.1, pitch = 1.0, volume = 1.0) {
    if (this.isMuted) return;
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Countdown warning: "three", "two", "one"
   */
  public playWarningBeep(secondsRemaining: number) {
    if (this.isMuted) return;

    const words: Record<number, string> = {
      3: 'Three',
      2: 'Two',
      1: 'One',
    };

    const word = words[secondsRemaining];
    if (word) {
      this.speak(word, 1.0, 1.0, 1.0);
    }
  }

  /**
   * Launch cue: "GO!"
   */
  public playLaunchChime() {
    if (this.isMuted) return;
    this.speak('Go!', 1.4, 1.1, 1.0);
  }

  /**
   * Optional: spoken name call (future feature)
   */
  public announcePlayer(playerName: string) {
    if (this.isMuted) return;
    this.speak(`${playerName}, go!`, 1.2, 1.0, 1.0);
  }
}

export const soundManager = new SoundManager();
