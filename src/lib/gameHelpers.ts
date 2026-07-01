import { getWinTarget } from './game-logic';
import { getCardStyle as getThemeCardStyle, getModalStyle as getThemeModalStyle } from './theme-utils';

interface ActiveGame {
  id: number;
  playerId: number;
  difficulty: string;
  score: number;
  timeElapsed: number;
  gameState: {
    grid: any[][];
    size: number;
    score: number;
    gameOver: boolean;
    won: boolean;
  } | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getZodiacName(avatarId: number | null | undefined): string {
  if (avatarId === null || avatarId === undefined) {
    return '鼠';
  }
  const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  const index = avatarId - 1;
  if (index < 0 || index >= zodiacNames.length) {
    return '鼠';
  }
  return zodiacNames[index] || '鼠';
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getCardStyle(cardOpacity: number, seasonalTheme: string) {
  return getThemeCardStyle(cardOpacity, seasonalTheme);
}

export function getModalStyle(cardOpacity: number, seasonalTheme: string) {
  return getThemeModalStyle(cardOpacity, seasonalTheme);
}

export function getModeLabel(game: ActiveGame | null): string {
  if (!game) return '';
  const size = game.gameState?.size;
  const sizeStr = size ? `${size}x${size}` : '';
  if (game.difficulty === 'easy') {
    const winTarget = getWinTarget(size || 4);
    return sizeStr ? `简单${sizeStr} 达到${winTarget}获胜` : `简单模式 达到${winTarget}获胜`;
  }
  return sizeStr ? `无尽${sizeStr}` : '无尽模式';
}
