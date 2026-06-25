const STORAGE_KEY = 'miresu-audio-muted';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private prewarmed = false;

  constructor() {
    this.muted =
      typeof window !== 'undefined' &&
      window.localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /** Create or resume AudioContext. Awaits resume so callers can play immediately. */
  private async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Prewarm AudioContext on first user interaction so subsequent plays have
   * zero latency. Listens for click/keydown/pointerdown, creates + resumes
   * the context, then removes the listeners.
   */
  prewarm() {
    if (typeof window === 'undefined' || this.prewarmed) return;
    this.prewarmed = true;

    const handler = () => {
      void this.ensureContext();
      window.removeEventListener('click', handler, true);
      window.removeEventListener('keydown', handler, true);
      window.removeEventListener('pointerdown', handler, true);
    };

    // Use capture phase so prewarm fires before any bubbling click handlers
    window.addEventListener('click', handler, true);
    window.addEventListener('keydown', handler, true);
    window.addEventListener('pointerdown', handler, true);
  }

  get isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      if (this.muted) {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    return this.muted;
  }

  /** Triangle tick at a given frequency/volume/duration. */
  private playTriangle(freq: number, vol: number, duration: number) {
    void this.ensureContext().then((ctx) => {
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /** Directory item click — base triangle tick. */
  playTick(reducedMotion = false) {
    if (this.muted || reducedMotion) return;
    this.playTriangle(440, 0.06, 0.08);
  }

  /** Filter tab switch — higher, softer variant. */
  playTab(reducedMotion = false) {
    if (this.muted || reducedMotion) return;
    this.playTriangle(660, 0.04, 0.06);
  }

  /** Consulting CTA — lower, heavier variant. */
  playConsulting(reducedMotion = false) {
    if (this.muted || reducedMotion) return;
    this.playTriangle(220, 0.10, 0.14);
  }
}

export const audio = new AudioEngine();
