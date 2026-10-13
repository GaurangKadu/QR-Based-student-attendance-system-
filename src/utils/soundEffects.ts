/**
 * Web Audio API Sound Effects Engine
 * Zero-dependency, low-latency, works offline, fully synthesized.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    // Read saved preference, default to unmuted (sound on)
    try {
      const saved = localStorage.getItem('qr_attendance_sound_muted');
      this.muted = saved === 'true';
    } catch {
      this.muted = false;
    }

    // Auto-unlock on first user interaction
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('qr_attendance_sound_muted', muted ? 'true' : 'false');
    } catch {
      // storage quota or private mode
    }
    this.listeners.forEach((cb) => cb(muted));
  }

  public toggleMute(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) {
      // Play a short confirmation pop when unmuting
      this.playPop();
    }
    return next;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Crisp tactile button click / tap
   */
  public playClick(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore audio glitches
    }
  }

  /**
   * Soft pop for tab transitions and toggles
   */
  public playPop(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.045);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  /**
   * Crisp scanner chirp when a QR code is detected
   */
  public playScan(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.045);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.05); // G6
      gain2.gain.setValueAtTime(0.18, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  /**
   * Harmonious multi-bell chime for successful attendance / positive action
   */
  public playSuccess(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.16, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Warm double warning beep (e.g. duplicate attendance or geofence boundary warning)
   */
  public playWarning(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(466.16, now + offset); // Bb4
        osc.frequency.exponentialRampToValueAtTime(392.0, now + offset + 0.08); // G4

        gain.gain.setValueAtTime(0.14, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Soft descending error thud
   */
  public playError(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // ignore
    }
  }

  /**
   * Tactile low deletion / removal sound
   */
  public playDelete(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();

export const playClickSound = () => soundEngine.playClick();
export const playPopSound = () => soundEngine.playPop();
export const playScanSound = () => soundEngine.playScan();
export const playSuccessSound = () => soundEngine.playSuccess();
export const playWarningSound = () => soundEngine.playWarning();
export const playErrorSound = () => soundEngine.playError();
export const playDeleteSound = () => soundEngine.playDelete();
