// Sound effects utility using Web Audio API (web) or expo-audio (native)
// No audio files needed - sounds are generated programmatically on web
// On React Native, sounds are generated using base64-encoded WAV files

import { Platform } from 'react-native';

// Import React Native sound implementation
import * as SoundsRN from './sounds-rn';

export type SoundType = "move" | "merge" | "win" | "gameover";

// Check if we're running in a browser environment with Web Audio API support
const isWebWithAudio = typeof window !== "undefined" &&
  (typeof window.AudioContext !== "undefined" ||
   typeof (window as any).webkitAudioContext !== "undefined");

// Check if running on native platform
const isNative = Platform.OS !== 'web';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private activeNodes: Array<{ oscillator: OscillatorNode; gainNode: GainNode }> = [];
  private isNative: boolean;

  constructor() {
    this.isNative = Platform.OS !== 'web';
    // Initialize AudioContext on first user interaction (web only)
    if (!this.isNative && isWebWithAudio) {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    if (!isWebWithAudio) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  // Clean up resources
  dispose() {
    // Stop all active oscillators
    this.activeNodes.forEach(({ oscillator, gainNode }) => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    this.activeNodes = [];

    // Close AudioContext
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    this.audioContext = null;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private trackNode(oscillator: OscillatorNode, gainNode: GainNode) {
    this.activeNodes.push({ oscillator, gainNode });

    // Auto-remove after sound is done playing (estimated duration)
    const maxDuration = 1; // 1 second max
    setTimeout(() => {
      const index = this.activeNodes.findIndex(
        (n) => n.oscillator === oscillator && n.gainNode === gainNode
      );
      if (index !== -1) {
        this.activeNodes.splice(index, 1);
      }
    }, maxDuration * 1000);
  }

  // Play a tone with specified frequency and duration
  private playTone(
    frequency: number,
    duration: number,
    volume: number = 0.3,
    type: OscillatorType = "sine"
  ) {
    // On native platforms, sound is disabled
    if (this.isNative || !this.enabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope to prevent clicking sounds
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);

      // Track for cleanup
      this.trackNode(oscillator, gainNode);
    } catch (e) {
      console.warn("Error playing tone:", e);
    }
  }

  // Play a sequence of tones (for more complex sounds)
  private playSequence(tones: Array<{ frequency: number; duration: number; delay: number }>) {
    // On native platforms, sound is disabled
    if (this.isNative || !this.enabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      tones.forEach((tone, _index) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.value = tone.frequency;
        oscillator.type = "sine";

        const startTime = now + tone.delay;
        const endTime = startTime + tone.duration;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);

        // Track for cleanup
        this.trackNode(oscillator, gainNode);
      });
    } catch (e) {
      console.warn("Error playing sequence:", e);
    }
  }

  // Sound effect: tile moves
  async playMove() {
    // Soft woosh sound - quick low tone
    // On native, use expo-audio implementation
    if (isNative) {
      await SoundsRN.playSound('move');
    } else {
      this.playTone(200, 0.1, 0.15, "sine");
    }
  }

  // Sound effect: tiles merge
  async playMerge() {
    // Pleasant ding - ascending two tones
    // On native, use expo-audio implementation
    if (isNative) {
      await SoundsRN.playSound('merge');
    } else {
      this.playSequence([
        { frequency: 523, duration: 0.1, delay: 0 }, // C5
        { frequency: 659, duration: 0.15, delay: 0.05 }, // E5
      ]);
    }
  }

  // Sound effect: victory
  async playWin() {
    // Victory fanfare - ascending major arpeggio
    // On native, use expo-audio implementation
    if (isNative) {
      await SoundsRN.playSound('win');
    } else {
      this.playSequence([
        { frequency: 523, duration: 0.15, delay: 0 }, // C5
        { frequency: 659, duration: 0.15, delay: 0.12 }, // E5
        { frequency: 784, duration: 0.15, delay: 0.24 }, // G5
        { frequency: 1047, duration: 0.3, delay: 0.36 }, // C6
      ]);
    }
  }

  // Sound effect: game over
  async playGameOver() {
    // Sad descending tones
    // On native, use expo-audio implementation
    if (isNative) {
      await SoundsRN.playSound('gameover');
    } else {
      this.playSequence([
        { frequency: 392, duration: 0.2, delay: 0 }, // G4
        { frequency: 330, duration: 0.2, delay: 0.15 }, // E4
        { frequency: 262, duration: 0.4, delay: 0.3 }, // C4
      ]);
    }
  }

  // Play any sound type
  async play(sound: SoundType) {
    switch (sound) {
      case "move":
        await this.playMove();
        break;
      case "merge":
        await this.playMerge();
        break;
      case "win":
        await this.playWin();
        break;
      case "gameover":
        await this.playGameOver();
        break;
    }
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

// Convenience functions
export async function playSound(sound: SoundType) {
  await getSoundManager().play(sound);
}

export function setSoundEnabled(enabled: boolean) {
  getSoundManager().setEnabled(enabled);
  // Also update RN sound manager
  SoundsRN.setSoundEnabled(enabled);
}

export function isSoundEnabled(): boolean {
  return getSoundManager().isEnabled();
}

// Clean up sound manager resources (call this when app is shutting down)
export function cleanupSoundManager() {
  if (soundManagerInstance) {
    soundManagerInstance.dispose();
    soundManagerInstance = null;
  }
}

// Auto-cleanup on page unload (prevents memory leaks)
// Only on web platform - React Native apps don't have beforeunload events
if (Platform.OS === 'web' && typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cleanupSoundManager();
  });
}
