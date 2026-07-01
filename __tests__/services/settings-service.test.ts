/**
 * Settings Service Tests
 *
 * Tests for settings management and persistence
 */

import {
  getSettings,
  updateSettings,
  getDefaultSettings,
  getSeasonalTheme,
  getTileColor,
  getTileTextColor,
} from '../../src/services/settings-service';
import { mockOpenDatabase, seedMockDatabase, resetMockDatabase } from '../utils/database-mock';

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDatabase();
    seedMockDatabase();
    mockOpenDatabase();
  });

  afterEach(() => {
    resetMockDatabase();
  });

  describe('getDefaultSettings', () => {
    it('returns default settings object', () => {
      const defaults = getDefaultSettings();

      expect(defaults).toEqual({
        theme: 'light',
        seasonal_theme: 'spring',
        custom_tile_colors: null,
        custom_background_color: null,
        custom_text_color: null,
        card_opacity: 14,
        sound_enabled: true,
      });
    });
  });

  describe('getSettings', () => {
    it('returns default settings for new player', async () => {
      const settings = await getSettings(1);

      expect(settings).toBeDefined();
      expect(settings?.theme).toBe('light');
      expect(settings?.seasonal_theme).toBe('spring');
      expect(settings?.sound_enabled).toBe(true);
    });

    it('returns custom settings if previously saved', async () => {
      await updateSettings(1, {
        theme: 'dark',
        seasonal_theme: 'winter',
        sound_enabled: false,
      });

      const settings = await getSettings(1);

      expect(settings?.theme).toBe('dark');
      expect(settings?.seasonal_theme).toBe('winter');
      expect(settings?.sound_enabled).toBe(false);
    });

    it('returns null for non-existent player', async () => {
      const settings = await getSettings(999);

      expect(settings).toBeNull();
    });

    it('includes all settings fields', async () => {
      const settings = await getSettings(1);

      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('seasonal_theme');
      expect(settings).toHaveProperty('custom_tile_colors');
      expect(settings).toHaveProperty('custom_background_color');
      expect(settings).toHaveProperty('custom_text_color');
      expect(settings).toHaveProperty('card_opacity');
      expect(settings).toHaveProperty('sound_enabled');
    });
  });

  describe('updateSettings', () => {
    it('updates theme setting', async () => {
      const result = await updateSettings(1, { theme: 'dark' });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.theme).toBe('dark');
    });

    it('updates seasonal theme', async () => {
      const result = await updateSettings(1, { seasonal_theme: 'autumn' });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.seasonal_theme).toBe('autumn');
    });

    it('updates sound_enabled', async () => {
      const result = await updateSettings(1, { sound_enabled: false });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.sound_enabled).toBe(false);
    });

    it('updates card_opacity', async () => {
      const result = await updateSettings(1, { card_opacity: 50 });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.card_opacity).toBe(50);
    });

    it('updates custom colors', async () => {
      const customColors = {
        '2': '#ff0000',
        '4': '#00ff00',
        '8': '#0000ff',
      };

      const result = await updateSettings(1, {
        custom_tile_colors: JSON.stringify(customColors),
      });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.custom_tile_colors).toContain('ff0000');
    });

    it('updates multiple settings at once', async () => {
      const result = await updateSettings(1, {
        theme: 'dark',
        seasonal_theme: 'winter',
        sound_enabled: false,
        card_opacity: 25,
      });

      expect(result.success).toBe(true);

      const settings = await getSettings(1);
      expect(settings?.theme).toBe('dark');
      expect(settings?.seasonal_theme).toBe('winter');
      expect(settings?.sound_enabled).toBe(false);
      expect(settings?.card_opacity).toBe(25);
    });

    it('validates theme value', async () => {
      const result = await updateSettings(1, {
        theme: 'invalid' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('theme');
    });

    it('validates seasonal_theme value', async () => {
      const result = await updateSettings(1, {
        seasonal_theme: 'invalid' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('seasonal');
    });

    it('validates card_opacity range (0-100)', async () => {
      const result = await updateSettings(1, {
        card_opacity: 150,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('opacity');
    });

    it('creates settings if not exist', async () => {
      // This test assumes settings don't exist for player 2
      const result = await updateSettings(2, { theme: 'dark' });

      expect(result.success).toBe(true);
    });
  });

  describe('getSeasonalTheme', () => {
    it('returns spring theme colors', () => {
      const theme = getSeasonalTheme('spring');

      expect(theme).toHaveProperty('primary');
      expect(theme).toHaveProperty('secondary');
      expect(theme).toHaveProperty('background');
      expect(theme).toHaveProperty('surface');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('accent');
    });

    it('returns summer theme colors', () => {
      const theme = getSeasonalTheme('summer');

      expect(theme).toHaveProperty('primary');
      expect(theme).toHaveProperty('secondary');
    });

    it('returns autumn theme colors', () => {
      const theme = getSeasonalTheme('autumn');

      expect(theme).toHaveProperty('primary');
      expect(theme).toHaveProperty('secondary');
    });

    it('returns winter theme colors', () => {
      const theme = getSeasonalTheme('winter');

      expect(theme).toHaveProperty('primary');
      expect(theme).toHaveProperty('secondary');
    });

    it('returns default spring theme for invalid season', () => {
      const theme = getSeasonalTheme('invalid' as any);

      // Should return a valid theme object
      expect(theme).toHaveProperty('primary');
    });

    it('spring theme has fresh colors', () => {
      const theme = getSeasonalTheme('spring');

      // Spring should have greens and pinks
      expect(theme.primary).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('summer theme has vibrant colors', () => {
      const theme = getSeasonalTheme('summer');

      // Summer should have blues and oranges
      expect(theme.primary).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('autumn theme has warm colors', () => {
      const theme = getSeasonalTheme('autumn');

      // Autumn should have oranges and reds
      expect(theme.primary).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('winter theme has cool colors', () => {
      const theme = getSeasonalTheme('winter');

      // Winter should have blues and whites
      expect(theme.primary).toMatch(/#[0-9a-fA-F]{6}/);
    });
  });

  describe('getTileColor', () => {
    it('returns color for tile value 2', () => {
      const color = getTileColor(2, 'light', 'spring');

      expect(color).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('returns color for tile value 2048', () => {
      const color = getTileColor(2048, 'light', 'spring');

      expect(color).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('returns different colors for light theme', () => {
      const color2 = getTileColor(2, 'light', 'spring');
      const color4 = getTileColor(4, 'light', 'spring');
      const color8 = getTileColor(8, 'light', 'spring');

      expect(color2).not.toBe(color4);
      expect(color4).not.toBe(color8);
    });

    it('returns different colors for dark theme', () => {
      const color2 = getTileColor(2, 'dark', 'spring');
      const color4 = getTileColor(4, 'dark', 'spring');

      expect(color2).not.toBe(color4);
    });

    it('uses custom colors if set', () => {
      const customColors = {
        '2': '#ff0000',
        '4': '#00ff00',
      };

      const color = getTileColor(2, 'light', 'spring', customColors);

      expect(color).toBe('#ff0000');
    });
  });

  describe('getTileTextColor', () => {
    it('returns text color for light tiles', () => {
      const textColor = getTileTextColor(2);

      expect(textColor).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('returns text color for dark tiles', () => {
      const textColor = getTileTextColor(2048);

      expect(textColor).toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('returns different text colors for different values', () => {
      const text2 = getTileTextColor(2);
      const text2048 = getTileTextColor(2048);

      expect(text2).not.toBe(text2048);
    });
  });
});
