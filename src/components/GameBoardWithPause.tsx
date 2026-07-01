/**
 * Game Board with Pause Overlay - React Native
 *
 * Displays the game board with pause overlay when paused.
 * Memoized to prevent unnecessary re-renders.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GameBoard } from './GameBoard';
import type { GameState, Tile } from '@/lib/game-logic';

interface GameBoardWithPauseProps {
  grid: (Tile | null)[][];
  size: number;
  seasonalTheme: string;
  customTileColors?: Record<number, string> | null;
  customTextColor?: string | null;
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  cardStyle: ViewStyle;
  isPaused: boolean;
  isViewReplay: boolean;
}

export const GameBoardWithPause = memo(function GameBoardWithPause({
  grid,
  size,
  seasonalTheme,
  customTileColors,
  customTextColor,
  onMove,
  cardStyle,
  isPaused,
  isViewReplay,
}: GameBoardWithPauseProps) {
  return (
    <View style={styles.boardContainer}>
      <GameBoard
        grid={grid}
        size={size}
        seasonalTheme={seasonalTheme}
        customTileColors={customTileColors}
        customTextColor={customTextColor}
        onMove={isViewReplay ? undefined : onMove}
        cardStyle={cardStyle}
      />
      {isPaused && !isViewReplay && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseEmoji}>⏸️</Text>
          <Text style={styles.pauseText}>游戏已暂停</Text>
          <Text style={styles.pauseSubtext}>点击"继续"按钮恢复游戏</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 248, 239, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  pauseEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  pauseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#776e65',
    marginBottom: 8,
  },
  pauseSubtext: {
    fontSize: 14,
    color: '#776e65',
  },
});
