/**
 * Score Panel Component - React Native
 *
 * Displays current score, best score, and elapsed time.
 * Memoized to prevent unnecessary re-renders.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface ScorePanelProps {
  currentScore: number;
  bestScore: number;
  elapsedTime: number;
  cardStyle: ViewStyle;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const ScorePanel = memo(function ScorePanel({
  currentScore,
  bestScore,
  elapsedTime,
  cardStyle,
}: ScorePanelProps) {
  return (
    <View style={[styles.scoreContainer, cardStyle]}>
      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>当前得分</Text>
        <Text style={styles.scoreValue}>{currentScore}</Text>
      </View>
      <View style={[styles.scoreItem, styles.scoreDivider]}>
        <Text style={styles.scoreLabel}>最佳纪录</Text>
        <Text style={styles.scoreValue}>{bestScore || '无'}</Text>
      </View>
      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>耗时</Text>
        <Text style={styles.scoreValue}>{formatTime(elapsedTime)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  scoreContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbada0',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#bbada0',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#776e65',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#776e65',
  },
});
