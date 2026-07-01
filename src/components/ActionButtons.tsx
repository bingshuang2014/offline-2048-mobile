/**
 * Action Buttons Component - React Native
 *
 * Displays game action buttons (pause, end, restart, history).
 * Memoized to prevent unnecessary re-renders.
 */

import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface ActionButtonsProps {
  isPaused: boolean;
  hasActiveGame: boolean;
  isViewReplay: boolean;
  onPauseToggle: () => void;
  onEndGame: () => void;
  onRestart: () => void;
  onHistory: () => void;
  cardStyle: ViewStyle;
}

export const ActionButtons = memo(function ActionButtons({
  isPaused,
  hasActiveGame,
  isViewReplay,
  onPauseToggle,
  onEndGame,
  onRestart,
  onHistory,
  cardStyle,
}: ActionButtonsProps) {
  const pauseDisabled = !hasActiveGame || isViewReplay;
  const endDisabled = !hasActiveGame || isPaused || isViewReplay;
  const restartDisabled = !hasActiveGame || isViewReplay;
  const historyDisabled = isViewReplay;

  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, cardStyle, pauseDisabled && styles.actionButtonDisabled]}
        onPress={onPauseToggle}
        disabled={pauseDisabled}
      >
        <Text style={[styles.actionButtonText, pauseDisabled && styles.actionButtonTextDisabled]}>
          {isPaused ? '继续' : '暂停'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, cardStyle, endDisabled && styles.actionButtonDisabled]}
        onPress={onEndGame}
        disabled={endDisabled}
      >
        <Text style={[styles.actionButtonText, endDisabled && styles.actionButtonTextDisabled]}>
          结束游戏
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, cardStyle, restartDisabled && styles.actionButtonDisabled]}
        onPress={onRestart}
        disabled={restartDisabled}
      >
        <Text style={[styles.actionButtonText, restartDisabled && styles.actionButtonTextDisabled]}>
          重新开始
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, cardStyle, historyDisabled && styles.actionButtonDisabled]}
        onPress={onHistory}
        disabled={historyDisabled}
      >
        <Text style={[styles.actionButtonText, historyDisabled && styles.actionButtonTextDisabled]}>
          历史
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbada0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#ccc0b3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#776e65',
  },
  actionButtonTextDisabled: {
    color: '#aaa090',
  },
});
