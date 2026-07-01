/**
 * Haptic Feedback - React Native (Expo Haptics)
 *
 * React Native version of haptic feedback using Expo Haptics.
 * Migrated from src/lib/haptics.ts (Capacitor Haptics)
 */

import * as Haptics from 'expo-haptics';

export type HapticType = 'move' | 'merge' | 'win' | 'gameover';

/**
 * Haptic Manager for React Native
 */
class HapticManager {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isPlatformSupported(): boolean {
    // Expo Haptics supports both iOS and Android
    return true;
  }

  /**
   * Light impact for tile movement
   */
  async playMove() {
    if (!this.enabled) {
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('[haptics-rn] Error playing move haptic:', e);
    }
  }

  /**
   * Medium impact for tile merge
   */
  async playMerge() {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('[haptics-rn] Error playing merge haptic:', e);
    }
  }

  /**
   * Success feedback for winning (reaching 2048)
   */
  async playWin() {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('[haptics-rn] Error playing win haptic:', e);
    }
  }

  /**
   * Heavy impact for game over
   */
  async playGameover() {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      console.warn('[haptics-rn] Error playing gameover haptic:', e);
    }
  }

  /**
   * Play haptic by type
   */
  async play(type: HapticType) {
    switch (type) {
      case 'move':
        await this.playMove();
        break;
      case 'merge':
        await this.playMerge();
        break;
      case 'win':
        await this.playWin();
        break;
      case 'gameover':
        await this.playGameover();
        break;
    }
  }
}

// Singleton instance
export const hapticManager = new HapticManager();

// Convenience functions
export const playHaptic = (type: HapticType) => hapticManager.play(type);
export const setHapticEnabled = (enabled: boolean) => hapticManager.setEnabled(enabled);
export const isHapticEnabled = () => hapticManager.isEnabled();
export const isHapticSupported = () => hapticManager.isPlatformSupported();
