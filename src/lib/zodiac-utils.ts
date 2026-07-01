/**
 * Zodiac Utilities
 *
 * Utility functions for zodiac-related operations
 */

/**
 * Get zodiac emoji by name
 * @param name - Zodiac name in Chinese (鼠, 牛, 虎, etc.)
 * @returns Emoji string or question mark if not found
 */
export function getZodiacEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    鼠: '🐭',
    牛: '🐮',
    虎: '🐯',
    兔: '🐰',
    龙: '🐲',
    蛇: '🐍',
    马: '🐴',
    羊: '🐏',
    猴: '🐵',
    鸡: '🐔',
    狗: '🐶',
    猪: '🐷',
  };
  return emojiMap[name] || '❓';
}

/**
 * Get zodiac emoji by ID
 * @param id - Zodiac ID (1-12)
 * @returns Emoji string or question mark if not found
 */
export function getZodiacEmojiById(id: number): string {
  const emojiMap: Record<number, string> = {
    1: '🐭',
    2: '🐮',
    3: '🐯',
    4: '🐰',
    5: '🐲',
    6: '🐍',
    7: '🐴',
    8: '🐏',
    9: '🐵',
    10: '🐔',
    11: '🐶',
    12: '🐷',
  };
  return emojiMap[id] || '❓';
}

/**
 * Get all zodiac names with their IDs
 * @returns Array of zodiac objects with id and name
 */
export function getAllZodiacs(): Array<{ id: number; name: string; emoji: string }> {
  return [
    { id: 1, name: '鼠', emoji: '🐭' },
    { id: 2, name: '牛', emoji: '🐮' },
    { id: 3, name: '虎', emoji: '🐯' },
    { id: 4, name: '兔', emoji: '🐰' },
    { id: 5, name: '龙', emoji: '🐲' },
    { id: 6, name: '蛇', emoji: '🐍' },
    { id: 7, name: '马', emoji: '🐴' },
    { id: 8, name: '羊', emoji: '🐏' },
    { id: 9, name: '猴', emoji: '🐵' },
    { id: 10, name: '鸡', emoji: '🐔' },
    { id: 11, name: '狗', emoji: '🐶' },
    { id: 12, name: '猪', emoji: '🐷' },
  ];
}
