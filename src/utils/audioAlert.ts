/**
 * Audio Alert Functions wired to Web Audio API sound engine
 */
import {
  playSuccessSound,
  playWarningSound,
  playErrorSound,
  playScanSound,
  playClickSound,
  playPopSound,
  playDeleteSound,
  soundEngine
} from './soundEffects';

export function playBigSuccessSound(): void {
  playSuccessSound();
}

export function playDuplicateWarningSound(): void {
  playWarningSound();
}

export function playErrorSoundAlert(): void {
  playErrorSound();
}

export {
  playSuccessSound,
  playWarningSound,
  playErrorSound,
  playScanSound,
  playClickSound,
  playPopSound,
  playDeleteSound,
  soundEngine
};
