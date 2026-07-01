import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { formatTime, getCardStyle, getModalStyle } from '../../lib/gameHelpers';

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

interface RestartConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  viewReplayMode: boolean;
  replayGameData: ActiveGame | null;
  activeGame: ActiveGame | null;
  elapsedTime: number;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
  };
}

export function RestartConfirmDialog({
  visible,
  onClose,
  onConfirm,
  viewReplayMode,
  replayGameData,
  activeGame,
  elapsedTime,
  cardOpacity,
  seasonalTheme,
  themedStyles,
}: RestartConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, getModalStyle(cardOpacity, seasonalTheme), styles.gameResultModalContent]}>
          <View style={styles.gameResultHeader}>
            <Text style={styles.gameResultEmoji}>🔄</Text>
            <Text style={[styles.gameResultTitle, themedStyles.text]}>
              {viewReplayMode ? '开始新游戏' : '重新开始'}
            </Text>
          </View>

          <View style={styles.gameResultInfo}>
            {viewReplayMode ? (
              <>
                <Text style={[styles.gameResultPlayerName, themedStyles.text]}>
                  查看历史对局：
                </Text>
                <View style={[styles.gameResultStats, themedStyles.secondaryBorder]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, themedStyles.textSecondary]}>分数</Text>
                    <Text style={[styles.statValue, themedStyles.text]}>{replayGameData?.score || 0}</Text>
                  </View>
                  <View style={[styles.statDivider, themedStyles.secondaryBorder]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, themedStyles.textSecondary]}>时间</Text>
                    <Text style={[styles.statValue, themedStyles.text]}>{formatTime(replayGameData?.timeElapsed || 0)}</Text>
                  </View>
                </View>
                <Text style={[styles.confirmMessage, themedStyles.textSecondary, { marginTop: 20 }]}>
                  确定要开始新游戏吗？
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.gameResultPlayerName, themedStyles.text]}>
                  当前游戏进度：
                </Text>
                <View style={[styles.gameResultStats, themedStyles.secondaryBorder]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, themedStyles.textSecondary]}>分数</Text>
                    <Text style={[styles.statValue, themedStyles.text]}>{activeGame?.score || 0}</Text>
                  </View>
                  <View style={[styles.statDivider, themedStyles.secondaryBorder]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, themedStyles.textSecondary]}>时间</Text>
                    <Text style={[styles.statValue, themedStyles.text]}>{formatTime(elapsedTime)}</Text>
                  </View>
                </View>
                <Text style={[styles.confirmMessage, themedStyles.textSecondary, { marginTop: 20 }]}>
                  确定要重新开始吗？当前进度将丢失。
                </Text>
              </>
            )}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonSecondaryText, { color: '#000000' }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDanger, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, { color: '#000000' }]}>
                {viewReplayMode ? '开始新游戏' : '重新开始'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
