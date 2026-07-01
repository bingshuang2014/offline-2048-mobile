/**
 * Mode Selection Component - React Native
 *
 * Displays game mode selection (easy/hard with grid sizes).
 * Memoized to prevent unnecessary re-renders.
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface ModeSelectionProps {
  onStartGame: (difficulty: 'easy' | 'hard', size: number) => void;
  cardStyle: ViewStyle;
}

export const ModeSelection = memo(function ModeSelection({
  onStartGame,
  cardStyle,
}: ModeSelectionProps) {
  return (
    <View style={styles.modeSelection}>
      <Text style={styles.modeSelectionTitle}>选择游戏模式</Text>
      <Text style={styles.modeSelectionSubtitle}>选择难度和网格大小开始新游戏</Text>

      <View style={styles.modeSection}>
        <Text style={styles.modeTitle}>简单模式</Text>
        <View style={styles.sizeButtons}>
          {[3, 4, 5].map((size) => (
            <TouchableOpacity
              key={`easy-${size}`}
              style={[styles.sizeButton, { borderColor: '#90EE90' }, cardStyle]}
              onPress={() => onStartGame('easy', size)}
            >
              <Text style={styles.sizeButtonText}>{size}x{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.modeSection, styles.modeSectionBorder]}>
        <Text style={styles.modeTitle}>无尽模式</Text>
        <View style={styles.sizeButtons}>
          {[3, 4, 5].map((size) => (
            <TouchableOpacity
              key={`hard-${size}`}
              style={[styles.sizeButton, { borderColor: '#EF4444' }, cardStyle]}
              onPress={() => onStartGame('hard', size)}
            >
              <Text style={styles.sizeButtonText}>{size}x{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  modeSelection: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  modeSelectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#776e65',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeSelectionSubtitle: {
    fontSize: 16,
    color: '#776e65',
    opacity: 0.7,
    marginBottom: 30,
    textAlign: 'center',
  },
  modeSection: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  modeSectionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#bbada0',
    paddingTop: 24,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#776e65',
    marginBottom: 16,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  sizeButton: {
    width: 90,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#776e65',
  },
});
