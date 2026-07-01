import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../../lib/gameStyles';
import { getCardStyle, getModalStyle, formatTime } from '../../lib/gameHelpers';

interface Player {
  id: number;
  epitaph: string;
  avatarId: number;
}

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

interface PersonalBest {
  'easy-3': number;
  'easy-4': number;
  'easy-5': number;
  'hard-3': number;
  'hard-4': number;
  'hard-5': number;
}

interface GameResultDialogProps {
  visible: boolean;
  type: 'victory' | 'gameOver' | null;
  onClose: () => void;
  onGoHome: () => void;
  onViewReplay: () => void;
  onPlayAgain: () => void;
  player: Player | null;
  score: number;
  timeElapsed: number;
  currentDifficulty: string;
  activeGame: ActiveGame | null;
  personalBest: PersonalBest;
  cardOpacity: number;
  seasonalTheme: string;
  themedStyles: {
    text: object;
    textSecondary: object;
    border: object;
    secondaryBorder: object;
  };
}

export function GameResultDialog({
  visible,
  type,
  onClose,
  onGoHome,
  onViewReplay,
  onPlayAgain,
  player,
  score,
  timeElapsed,
  currentDifficulty,
  activeGame,
  personalBest,
  cardOpacity,
  seasonalTheme,
  themedStyles,
}: GameResultDialogProps) {
  const modeKey = `${currentDifficulty}-${activeGame?.gameState?.size || 4}` as keyof PersonalBest;
  const bestScore = personalBest[modeKey] || '无';

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
            <Text style={styles.gameResultEmoji}>
              {type === 'victory' ? '🎉' : '💀'}
            </Text>
            <Text style={[styles.gameResultTitle, themedStyles.text]}>
              {type === 'victory' ? '恭喜获胜！' : '游戏结束'}
            </Text>
          </View>

          <View style={styles.gameResultInfo}>
            <Text style={[styles.gameResultPlayerName, themedStyles.text]}>{player?.epitaph}</Text>
            <View style={[styles.gameResultStats, themedStyles.secondaryBorder]}>
              <View style={styles.gameResultStat}>
                <Text style={[styles.gameResultStatLabel, themedStyles.textSecondary]}>当前得分</Text>
                <Text style={[styles.gameResultStatValue, themedStyles.text]}>{score}</Text>
              </View>
              <View style={[styles.gameResultStat, styles.gameResultStatBorder, themedStyles.secondaryBorder]}>
                <Text style={[styles.gameResultStatLabel, themedStyles.textSecondary]}>耗时</Text>
                <Text style={[styles.gameResultStatValue, themedStyles.text]}>{formatTime(timeElapsed)}</Text>
              </View>
              <View style={styles.gameResultStat}>
                <Text style={[styles.gameResultStatLabel, themedStyles.textSecondary]}>最佳纪录</Text>
                <Text style={[styles.gameResultStatValue, themedStyles.text]}>{bestScore}</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
              onPress={onGoHome}
            >
              <Text style={[styles.modalButtonSecondaryText, { color: '#000000' }]}>返回主页</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
              onPress={onViewReplay}
            >
              <Text style={[styles.modalButtonSecondaryText, { color: '#000000' }]}>查看对局</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, getCardStyle(cardOpacity, seasonalTheme), themedStyles.border]}
              onPress={onPlayAgain}
            >
              <Text style={[styles.modalButtonText, { color: '#000000' }]}>再来一局</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
