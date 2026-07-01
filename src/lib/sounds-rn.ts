/**
 * Sound Effects - React Native (expo-av)
 *
 * React Native version of sound effects using expo-av.
 * Plays base64-encoded WAV files for move, merge, win, and gameover sounds.
 *
 * NOTE: Falls back gracefully in Expo Go (which doesn't support expo-av)
 */

import { Platform } from 'react-native';

// Try to import expo-av, but handle cases where it's not available (Expo Go)
let Audio: any | null = null;
let expoAvAvailable = false;

try {
  const expoAv = require('expo-av');
  Audio = expoAv.Audio;
  expoAvAvailable = true;
} catch (error) {
  console.warn('[Sounds] expo-av not available (Expo Go?), audio disabled');
  expoAvAvailable = false;
}

export type SoundType = 'move' | 'merge' | 'win' | 'gameover';

// Simple WAV file header + PCM audio data generator
// Creates minimal WAV files with beep/boop sounds
function generateWavFile(frequency: number, duration: number, volume: number = 0.3): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const byteRate = sampleRate * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const fileSize = 36 + dataSize;

  // WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk
  view.setUint32(0, 0x46464952, true); // "RIFF"
  view.setUint32(4, fileSize, true); // File size
  view.setUint32(8, 0x45564157, true); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x20746d66, true); // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, 1, true); // Number of channels (mono)
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // data chunk
  view.setUint32(36, 0x61746164, true); // "data"
  view.setUint32(40, dataSize, true); // Data size

  // Generate PCM audio data
  const audioData = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Apply envelope to prevent clicking - 更快的淡入淡出让声音更干脆
    const attackTime = 0.005; // 5ms淡入
    const releaseTime = 0.01; // 10ms淡出
    let envelope = 1;
    if (t < attackTime) {
      envelope = t / attackTime;
    } else if (t > duration - releaseTime) {
      envelope = (duration - t) / releaseTime;
    }
    audioData[i] = Math.floor(32767 * volume * envelope * Math.sin(2 * Math.PI * frequency * t));
  }

  // Combine header and audio data
  const wavFile = new Uint8Array(44 + dataSize);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(new Uint8Array(audioData.buffer), 44);

  // Convert to base64
  const binary = [];
  for (let i = 0; i < wavFile.length; i++) {
    binary.push(String.fromCharCode(wavFile[i]));
  }
  return btoa(binary.join(''));
}

// Pre-generate base64 audio data for each sound type
const soundData = {
  move: generateWavFile(300, 0.05, 0.12), // 短促的点击声
  merge: generateWavFile(523, 0.08, 0.18), // 短促的合成声
  win: generateWavFile(784, 0.3, 0.25), // 胜利音效保持较长
  gameover: generateWavFile(262, 0.3, 0.2), // 失败音效
};

class SoundManager {
  private enabled: boolean = true;
  private sounds: Map<SoundType, any> = new Map();
  private isNative: boolean;

  constructor() {
    this.isNative = Platform.OS !== 'web';
    // Only initialize sounds if expo-av is available
    if (this.isNative && expoAvAvailable && Audio) {
      this.initializeSounds();
    } else if (this.isNative && !expoAvAvailable) {
    }
  }

  private async initializeSounds() {
    if (!expoAvAvailable || !Audio) {
      return;
    }

    try {
      // Enable audio on iOS
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Pre-load all sounds
      for (const [type, base64Data] of Object.entries(soundData)) {
        try {
          const sound = new Audio.Sound();
          await sound.loadAsync({ uri: `data:audio/wav;base64,${base64Data}` });
          this.sounds.set(type as SoundType, sound);
        } catch (error) {
          console.warn(`[Sounds] Failed to load sound "${type}":`, error);
        }
      }

    } catch (error) {
      console.warn('[Sounds] Failed to initialize audio:', error);
      expoAvAvailable = false; // Disable audio if initialization fails
    }
  }

  async play(type: SoundType): Promise<void> {
    if (!this.enabled || !expoAvAvailable) {
      return;
    }

    try {
      const sound = this.sounds.get(type);
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.warn(`[Sounds] Failed to play sound "${type}":`, error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled && expoAvAvailable;
  }

  isEnabled(): boolean {
    return this.enabled && expoAvAvailable;
  }

  // Check if audio is available
  isAudioAvailable(): boolean {
    return expoAvAvailable;
  }

  // Clean up resources
  async dispose(): Promise<void> {
    if (!expoAvAvailable) {
      return;
    }

    try {
      for (const sound of this.sounds.values()) {
        await sound.unloadAsync();
      }
      this.sounds.clear();
    } catch (error) {
      console.warn('[Sounds] Failed to dispose sounds:', error);
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

export async function playSound(type: SoundType): Promise<void> {
  const manager = getSoundManager();
  await manager.play(type);
}

export function setSoundEnabled(enabled: boolean): void {
  const manager = getSoundManager();
  manager.setEnabled(enabled);
}

export function isSoundEnabled(): boolean {
  const manager = getSoundManager();
  return manager.isEnabled();
}

export function isAudioAvailable(): boolean {
  const manager = getSoundManager();
  return manager.isAudioAvailable();
}
