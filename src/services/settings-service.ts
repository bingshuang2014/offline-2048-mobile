/**
 * Settings Service - Service layer for settings management
 *
 * This service provides a clean abstraction for settings operations,
 * routing to the appropriate backend based on platform:
 * - Web: Next.js API routes
 * - Native: Capacitor SQLite database
 */

import { Platform } from "react-native";
import type { Setting } from "@/lib/schema";

// ============================================================================
// Type Definitions
// ============================================================================

export interface SettingsData {
  theme: string;
  seasonalTheme: string;
  customTileColors: string | null;
  customBackgroundColor: string | null;
  customTextColor: string | null;
  cardOpacity: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  debugEnabled: boolean;
}

export interface UpdateSettingsRequest extends Partial<SettingsData> {
  playerId?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch wrapper for API calls (web platform)
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

const DEFAULT_SETTINGS: SettingsData = {
  theme: "light",
  seasonalTheme: "winter", // 默认冬主题
  customTileColors: null,
  customBackgroundColor: null,
  customTextColor: null,
  cardOpacity: 0, // 0% opacity (完全透明，0-100 scale)
  soundEnabled: true,
  hapticEnabled: true,
  debugEnabled: false, // Debug feature disabled by default
};

// ============================================================================
// Settings Service Methods
// ============================================================================

/**
 * Get settings for a player
 * @param playerId - Player ID
 * @returns Settings data or default settings on error
 */
export async function getSettings(playerId: number): Promise<SettingsData> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<{ settings: Setting }>(`/api/settings?playerId=${playerId}`);
      const settings = response.settings;
      return {
        theme: settings.theme,
        seasonalTheme: settings.seasonalTheme,
        customTileColors: settings.customTileColors,
        customBackgroundColor: settings.customBackgroundColor,
        customTextColor: settings.customTextColor,
        cardOpacity: settings.cardOpacity,
        soundEnabled: settings.soundEnabled,
        hapticEnabled: (settings as any).hapticEnabled ?? true,
        debugEnabled: (settings as any).debugEnabled ?? false,
      };
    } else {
      const { query } = await import("@/lib/db-expo");
      const settingsList = await query<any>(
        "SELECT * FROM settings WHERE player_id = ? ORDER BY updated_at DESC LIMIT 1",
        [playerId]
      );


      if (settingsList[0]) {
        const settings = settingsList[0];
        const result = {
          theme: settings.theme,
          seasonalTheme: settings.seasonal_theme,
          customTileColors: settings.custom_tile_colors,
          customBackgroundColor: settings.custom_background_color,
          customTextColor: settings.custom_text_color,
          // Explicitly handle 0 value vs null/undefined
          cardOpacity: settings.card_opacity == null ? 0 : Number(settings.card_opacity),
          soundEnabled: (Number(settings.sound_enabled) === 1),
          hapticEnabled: settings.haptic_enabled !== undefined ? (Number(settings.haptic_enabled) === 1) : true,
          debugEnabled: settings.debug_enabled !== undefined ? (Number(settings.debug_enabled) === 1) : false,
        };
        return result;
      }

      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error("[SettingsService] Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update settings for a player
 * @param playerId - Player ID
 * @param settings - Settings data to update
 * @returns true if successful, false otherwise
 */
export async function updateSettings(
  playerId: number,
  settings: UpdateSettingsRequest
): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...settings }),
      });
      return true;
    } else {
      const { execute } = await import("@/lib/db-expo");

      // Get current settings to merge with new values
      const currentSettings = await getSettings(playerId);

      // Merge current settings with new settings
      const mergedSettings: SettingsData = {
        theme: settings.theme ?? currentSettings.theme,
        seasonalTheme: settings.seasonalTheme ?? currentSettings.seasonalTheme,
        customTileColors: settings.customTileColors ?? currentSettings.customTileColors,
        customBackgroundColor: settings.customBackgroundColor ?? currentSettings.customBackgroundColor,
        customTextColor: settings.customTextColor ?? currentSettings.customTextColor,
        cardOpacity: settings.cardOpacity ?? currentSettings.cardOpacity,
        soundEnabled: settings.soundEnabled ?? currentSettings.soundEnabled,
        hapticEnabled: settings.hapticEnabled ?? currentSettings.hapticEnabled,
        debugEnabled: settings.debugEnabled ?? currentSettings.debugEnabled,
      };

      // Use INSERT OR REPLACE to ensure the record exists
      await execute(
        `INSERT OR REPLACE INTO settings (
          player_id, theme, seasonal_theme, custom_tile_colors,
          custom_background_color, custom_text_color, card_opacity,
          sound_enabled, haptic_enabled, debug_enabled, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          playerId,
          mergedSettings.theme,
          mergedSettings.seasonalTheme,
          mergedSettings.customTileColors,
          mergedSettings.customBackgroundColor,
          mergedSettings.customTextColor,
          mergedSettings.cardOpacity,
          mergedSettings.soundEnabled ? 1 : 0,
          mergedSettings.hapticEnabled ? 1 : 0,
          mergedSettings.debugEnabled ? 1 : 0,
          Date.now(),
        ]
      );

      return true;
    }
  } catch (error) {
    console.error("[SettingsService] Error updating settings:", error);
    return false;
  }
}

/**
 * Get default settings
 * @returns Default settings data
 */
export async function getDefaultSettings(): Promise<SettingsData> {
  try {
    if (Platform.OS === "web") {
      const response = await apiFetch<SettingsData>("/api/settings/defaults");
      return response;
    } else {
      // On native, just return hardcoded defaults
      return { ...DEFAULT_SETTINGS };
    }
  } catch (error) {
    console.error("[SettingsService] Error fetching default settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Reset settings to defaults for a player
 * @param playerId - Player ID
 * @returns true if successful, false otherwise
 */
export async function resetSettings(playerId: number): Promise<boolean> {
  return updateSettings(playerId, DEFAULT_SETTINGS);
}
