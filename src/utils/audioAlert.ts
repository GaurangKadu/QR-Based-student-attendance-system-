/**
 * High-Volume Web Audio Synthesizer for QR Attendance Verification
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!globalAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        globalAudioCtx = new AudioCtxClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch (err) {
    console.warn('AudioContext initialization error:', err);
    return null;
  }
}

/**
 * Big Loud Chime / High-Grade Scanner Success Tone
 */
export function playBigSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain for maximum volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);
    masterGain.connect(ctx.destination);

    // Chime Note 1: 659.25 Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Chime Note 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.8, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);

    // Big Loud Harmonic Note 3: 1318.5 Hz (E6) & 1760 Hz (A6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.5, now + 0.16);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.9, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.55);

    // Rich Octave Overtone for thickness
    const oscOvertone = ctx.createOscillator();
    const gainOvertone = ctx.createGain();
    oscOvertone.type = 'triangle';
    oscOvertone.frequency.setValueAtTime(1760, now + 0.16);
    gainOvertone.gain.setValueAtTime(0.001, now);
    gainOvertone.gain.setValueAtTime(0.6, now + 0.16);
    gainOvertone.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    oscOvertone.connect(gainOvertone);
    gainOvertone.connect(masterGain);
    oscOvertone.start(now + 0.16);
    oscOvertone.stop(now + 0.45);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

/**
 * Duplicate / Already Marked Warning Tone
 */
export function playDuplicateWarningSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(520, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(440, now + 0.15);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.35);
  } catch {
    // ignore
  }
}

/**
 * Error Buzzer Tone
 */
export function playErrorSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // ignore
  }
}
