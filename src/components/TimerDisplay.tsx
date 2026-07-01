/**
 * Timer Display Component - React Native
 *
 * Displays elapsed time as a standalone component.
 * Memoized to prevent unnecessary re-renders - only updates when time changes.
 */

import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  elapsedTime: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const TimerDisplay = memo(function TimerDisplay({ elapsedTime }: TimerDisplayProps) {
  return (
    <Text style={styles.timerText}>
      {formatTime(elapsedTime)}
    </Text>
  );
});

const styles = StyleSheet.create({
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#776e65',
  },
});
