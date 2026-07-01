/**
 * GameBoard Component - React Native
 *
 * This is the React Native version of the game board.
 * It uses PanResponder for swipe gesture detection.
 * Migrated from src/components/game-board.tsx
 */

import React, { useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { getSeasonalTheme, getTileTextColor } from '@/lib/seasonal-themes';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Tile {
  value: number;
  id: string;
}

interface GameBoardProps {
  grid: (Tile | null)[][];
  size: number;
  seasonalTheme: string;
  customTileColors?: Record<number, string> | null;
  customTextColor?: string | null;
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  cardStyle?: any;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get responsive cell size based on screen width and grid size
 * 让棋盘明显小于容器，清楚显示间隙
 */
function getCellSize(size: number): number {
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 20; // 容器左右各 10px padding
  const visibleGap = 40; // 棋盘和容器之间的可见间隙（左右各20px）
  const gap = 10;

  // 棋盘宽度 = 屏幕宽度 - 容器padding - 可见间隙
  const boardWidth = screenWidth - containerPadding - visibleGap;

  // 棋盘内部总间隙：只有格子之间的间隙
  const totalInternalGap = gap * (size - 1);

  // 可用于格子的总宽度 = 棋盘宽度 - 内部间隙
  const availableForCells = boardWidth - totalInternalGap;

  // 每个格子的宽度
  return Math.floor(availableForCells / size);
}

/**
 * Get tile background color
 */
function getTileColor(
  value: number,
  theme: any,
  customColors?: Record<number, string> | null
): string {
  if (customColors && customColors[value]) {
    return customColors[value];
  }

  // Use the seasonal theme's tileColors
  return theme.tileColors[value] || theme.tileColors[2] || '#eee4da';
}

// ============================================================================
// Tile Component
// ============================================================================

interface TileProps {
  value: number;
  size: number;
  position: { row: number; col: number };
  theme: any;
  customColors?: Record<number, string> | null;
  customTextColor?: string | null;
  cellSize: number;
}

const TileComponent = memo(function TileComponent({
  value,
  size,
  position,
  theme,
  customColors,
  customTextColor,
  cellSize,
}: TileProps) {
  const backgroundColor = getTileColor(value, theme, customColors);
  const textColor = customTextColor || getTileTextColor(value, theme.nameEn);
  const fontSize = cellSize * (value >= 1000 ? 0.35 : value >= 100 ? 0.4 : 0.5);

  const left = position.col * (cellSize + 10);
  const top = position.row * (cellSize + 10);

  return (
    <View
      style={[
        styles.tile,
        {
          width: cellSize,
          height: cellSize,
          left,
          top,
          backgroundColor,
          borderRadius: cellSize * 0.06,
        },
      ]}
    >
      <Text
        style={[
          styles.tileText,
          {
            color: textColor,
            fontSize,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
});

// ============================================================================
// GameBoard Component
// ============================================================================

export const GameBoard = memo(function GameBoard({
  grid,
  size,
  seasonalTheme,
  customTileColors,
  customTextColor,
  onMove,
  cardStyle,
}: GameBoardProps) {
  const theme = getSeasonalTheme(seasonalTheme);
  const cellSize = useMemo(() => getCellSize(size), [size]);

  // PanResponder for swipe gesture detection
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          // User started touching the board
        },

        onPanResponderEnd: (
          _evt: GestureResponderEvent,
          gestureState: PanResponderGestureState
        ) => {
          if (!onMove) return;

          const { dx, dy } = gestureState;
          const MIN_SWIPE_DISTANCE = 10; // Reduced for easier swipes


          // Check if swipe is long enough
          if (Math.abs(dx) < MIN_SWIPE_DISTANCE && Math.abs(dy) < MIN_SWIPE_DISTANCE) {
            return;
          }

          // Determine dominant direction
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            const direction = dx > 0 ? 'right' : 'left';
            onMove(direction);
          } else {
            // Vertical swipe
            const direction = dy > 0 ? 'down' : 'up';
            onMove(direction);
          }
        },
      }),
    [onMove]
  );

  // Collect all tiles
  const tiles = useMemo(() => {
    const result: Array<{
      value: number;
      id: string;
      position: { row: number; col: number };
    }> = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = grid[row]?.[col];
        if (tile) {
          result.push({
            value: tile.value,
            id: tile.id,
            position: { row, col },
          });
        }
      }
    }

    return result;
  }, [grid, size]);

  // 棋盘尺寸：size * (格子大小 + 间隙) - 最后一个间隙
  const boardSize = size * cellSize + (size - 1) * 10;

  return (
    <View
      style={[
        styles.container,
        {
          width: boardSize,
          height: boardSize,
          backgroundColor: theme.logoGridBackground || '#bbada0', // 使用主题色
        },
        cardStyle,
      ]}
      {...panResponder.panHandlers}
    >
      {/* Grid background cells */}
      {Array.from({ length: size }).map((_, row) =>
        Array.from({ length: size }).map((_, col) => (
          <View
            key={`bg-${row}-${col}`}
            style={[
              styles.backgroundCell,
              {
                width: cellSize,
                height: cellSize,
                left: col * (cellSize + 10),
                top: row * (cellSize + 10),
                backgroundColor: '#cdc1b4',
                borderRadius: cellSize * 0.06,
              },
            ]}
          />
        ))
      )}

      {/* Tiles */}
      {tiles.map((tile) => (
        <TileComponent
          key={tile.id}
          value={tile.value}
          size={size}
          position={tile.position}
          theme={theme}
          customColors={customTileColors}
          customTextColor={customTextColor}
          cellSize={cellSize}
        />
      ))}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to ensure re-render when grid changes
  // Grid is the most important prop, so we check it deeply
  if (prevProps.grid !== nextProps.grid) return false;
  if (prevProps.size !== nextProps.size) return false;
  if (prevProps.seasonalTheme !== nextProps.seasonalTheme) return false;
  if (prevProps.customTileColors !== nextProps.customTileColors) return false;
  if (prevProps.customTextColor !== nextProps.customTextColor) return false;
  if (prevProps.cardStyle !== nextProps.cardStyle) return false;

  // If all props are the same, don't re-render
  return true;
});

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },

  backgroundCell: {
    position: 'absolute',
  },

  tile: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    // 移除阴影以提升性能
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },

  tileText: {
    fontWeight: 'bold',
  },
});
