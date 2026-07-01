/**
 * Theme Utilities
 *
 * Utility functions for theme-related operations and styles
 */

import { getSeasonalTheme } from './seasonal-themes';

/**
 * Color interpolation between two colors
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated color string
 */
export function interpolateColor(
  color1: string,
  color2: string,
  factor: number
): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get card style with transparency based on card opacity
 * @param cardOpacity - Card opacity value (0-100)
 * @param seasonalTheme - Seasonal theme name
 * @returns Card style object with backgroundColor
 */
export function getCardStyle(
  cardOpacity: number,
  seasonalTheme: string = 'winter'
) {
  // cardOpacity: 100 = 纯白色, 0 = 主题背景色
  const opacity = cardOpacity / 100;
  const themeBg = getSeasonalTheme(seasonalTheme).background;
  const white = '#ffffff';

  // opacity 1 = 白色, opacity 0 = 主题背景色
  const backgroundColor = interpolateColor(white, themeBg, 1 - opacity);

  return {
    backgroundColor,
  };
}

/**
 * Get modal style with transparency based on card opacity
 * This is an alias for getCardStyle for semantic clarity
 * @param cardOpacity - Card opacity value (0-100)
 * @param seasonalTheme - Seasonal theme name
 * @returns Modal style object with backgroundColor
 */
export function getModalStyle(
  cardOpacity: number,
  seasonalTheme: string = 'winter'
) {
  return getCardStyle(cardOpacity, seasonalTheme);
}

/**
 * Get background color for a given tile value
 * @param value - Tile value (2, 4, 8, 16, etc.)
 * @param seasonalTheme - Seasonal theme name
 * @returns Background color for the tile
 */
export function getTileBackgroundColor(
  value: number,
  seasonalTheme: string = 'winter'
): string {
  const theme = getSeasonalTheme(seasonalTheme);
  return theme.tileColors[value] || theme.tileColors[2] || '#ffffff';
}

/**
 * Check if a color is light (for text color decision)
 * @param color - Hex color string
 * @returns True if color is light, false if dark
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
